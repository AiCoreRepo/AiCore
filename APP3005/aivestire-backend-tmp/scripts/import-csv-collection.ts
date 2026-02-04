import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

interface CSVProduct {
    Image: string;
    image_url: string;
    '@Occasion': string;
    '@Age Group': string;
    '@Recommended Body shape': string;
    '@Recommended size': string;
    '@Skin tone': string;
    'Clothing Type': string;
    Fit: string;
    Fabric: string;
    Color_family: string;
    Style: string;
    Description: string;
    Quality_Tag: string;
    Score: string;
    Prompt: string;
}

async function importCSVToProduction() {
    try {
        console.log('🚀 Starting CSV import to production database...');
        console.log('📍 Database:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Unknown');

        // Read CSV file
        const csvPath = path.join(process.cwd(), 'Collection_data', 'main_train_data.csv');
        console.log(`📂 Reading CSV from: ${csvPath}`);

        const fileContent = fs.readFileSync(csvPath, 'utf-8');
        const products: CSVProduct[] = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
        });

        console.log(`📦 Found ${products.length} products in CSV`);

        // Find or create a creator account for these products
        let creator = await prisma.user.findFirst({
            where: { role: 'CREATOR' },
        });

        if (!creator) {
            console.log('⚠️  No creator found. Creating default creator account...');
            creator = await prisma.user.create({
                data: {
                    email: 'collections@aivestire.com',
                    password_hash: 'PLACEHOLDER', // Should be hashed in production
                    role: 'CREATOR',
                },
            });
            console.log(`✅ Created creator account: ${creator.email}`);
        } else {
            console.log(`✅ Using existing creator: ${creator.email}`);
        }

        // Import products
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (let i = 0; i < products.length; i++) {
            const product = products[i];

            try {
                // Check if product already exists (by image URL)
                const existing = await prisma.product.findFirst({
                    where: {
                        metadata: {
                            path: ['cloth_id'],
                            equals: product.Image,
                        },
                    },
                });

                if (existing) {
                    console.log(`⏭️  Skipping ${i + 1}/${products.length}: Already exists (${product.Image})`);
                    skipCount++;
                    continue;
                }

                // Generate title from description or clothing type
                const title = product.Description?.substring(0, 100) ||
                    `${product.Style || ''} ${product['Clothing Type'] || 'Outfit'}`.trim();

                // Generate slug
                const slug = `${product['Clothing Type']?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'product'}-${Date.now()}-${i}`;

                // Parse price from score (higher score = higher price)
                const score = parseFloat(product.Score || '0.5');
                const basePrice = 2000; // ₹20
                const priceCents = Math.round(basePrice + (score * 3000)); // ₹20-50 range

                // Create product
                await prisma.product.create({
                    data: {
                        title: title,
                        slug: slug,
                        description: product.Description || '',
                        price_cents: priceCents,
                        inventory_count: 10, // Default inventory
                        category: product['Clothing Type'] || 'Clothing',
                        status: 'APPROVED',
                        is_deleted: false,
                        creator_id: creator.user_id,
                        metadata: {
                            cloth_id: product.Image,
                            occasion: product['@Occasion'],
                            age_group: product['@Age Group'],
                            body_shape: product['@Recommended Body shape'],
                            recommended_size: product['@Recommended size'],
                            skin_tone: product['@Skin tone'],
                            clothing_type: product['Clothing Type'],
                            fit: product.Fit,
                            fabric: product.Fabric,
                            color_family: product.Color_family,
                            style: product.Style,
                            quality_tag: product.Quality_Tag,
                            score: product.Score,
                        } as any,
                        images: {
                            create: [
                                {
                                    url: product.image_url,
                                    is_primary: true,
                                    order_index: 0,
                                },
                            ],
                        },
                    },
                });

                successCount++;
                console.log(`✅ Imported ${i + 1}/${products.length}: ${title.substring(0, 50)}...`);

            } catch (error: any) {
                errorCount++;
                console.error(`❌ Error importing ${i + 1}/${products.length}:`, error?.message || error);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 Import Summary:');
        console.log(`   ✅ Successfully imported: ${successCount}`);
        console.log(`   ⏭️  Skipped (already exists): ${skipCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log(`   📦 Total processed: ${products.length}`);
        console.log('='.repeat(60));

    } catch (error: any) {
        console.error('💥 Fatal error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the import
importCSVToProduction()
    .then(() => {
        console.log('✅ Import completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Import failed:', error);
        process.exit(1);
    });
