const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importProductsFromJSON() {
    try {
        console.log('📊 Starting product import from JSON...\n');

        // Read the JSON file
        const jsonPath = path.join(__dirname, '../../APP3005_AI/recommend_demo/collection2_train.json');
        console.log(`📁 Reading JSON file: ${jsonPath}`);

        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const products = JSON.parse(rawData);

        console.log(`✅ Found ${products.length} products in JSON file\n`);

        // Get or create a default collection
        let collection = await prisma.collection.findFirst({
            where: { name: 'AI Collection 2' }
        });

        if (!collection) {
            console.log('Creating AI Collection 2...');
            collection = await prisma.collection.create({
                data: {
                    name: 'AI Collection 2',
                    description: 'Premium Indian fashion collection with AI-curated styles',
                    header_image_url: 'https://res.cloudinary.com/dxfxicebq/image/upload/v1768925353/FinalIntroVideo_b6ppih.mp4',
                    is_active: true
                }
            });
            console.log(`✅ Created collection: ${collection.name}\n`);
        }

        // Get creator user (admin or first user)
        const creator = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!creator) {
            console.error('❌ No admin user found. Please create an admin user first.');
            return;
        }

        console.log(`👤 Using creator: ${creator.email}\n`);
        console.log('🚀 Starting import...\n');

        let imported = 0;
        let skipped = 0;
        let errors = 0;

        for (const item of products) {
            try {
                // Map JSON fields to product data
                const productData = {
                    name: `${item.cloth_type.replace(/_/g, ' ')} - ${item.cloth_id}`,
                    description: item.description,
                    price: 2999, // Default price, adjust as needed
                    category: item.cloth_type.replace(/_/g, ' '),
                    gender: 'FEMALE', // Based on JSON context
                    size: item.sizes ? item.sizes.join(', ') : 'M',
                    color: item.color_family ? item.color_family.join(', ') : 'Default',
                    material: item.fabric ? item.fabric.join(', ') : 'Premium',
                    brand: 'Aivestire',
                    stock_quantity: 50,
                    // Additional metadata
                    occasion: item.occasion ? item.occasion.join(', ') : null,
                    fit: item.fit ? item.fit.join(', ') : null,
                    style: item.style ? item.style.join(', ') : null,
                    skin_tone: item.skin_tone ? item.skin_tone.join(', ') : null,
                    body_shape: item.body_shape ? item.body_shape.join(', ') : null,
                    age_range: item.age_range ? item.age_range.join(', ') : null,
                };

                // Check if image path exists (we'll need to convert local paths to Cloudinary URLs)
                // For now, we'll use a placeholder or skip if no Cloudinary URL
                const imageUrl = item.cloudinary_url || item.image_url || null;

                if (!imageUrl && item.image) {
                    console.log(`⚠️  Skipping ${item.cloth_id}: No Cloudinary URL (has local path: ${item.image})`);
                    skipped++;
                    continue;
                }

                // Create product
                const product = await prisma.product.create({
                    data: {
                        name: productData.name,
                        description: productData.description,
                        price: productData.price,
                        category: productData.category,
                        gender: productData.gender,
                        size: productData.size,
                        color: productData.color,
                        material: productData.material,
                        brand: productData.brand,
                        stock_quantity: productData.stock_quantity,
                        collection_id: collection.collection_id,
                        creator_id: creator.user_id,
                        is_active: true,
                    }
                });

                // Create product image if URL exists
                if (imageUrl) {
                    await prisma.productImage.create({
                        data: {
                            product_id: product.product_id,
                            image_url: imageUrl,
                            is_primary: true,
                            display_order: 0
                        }
                    });
                }

                // Create approved product approval
                await prisma.productApproval.create({
                    data: {
                        product_id: product.product_id,
                        status: 'APPROVED',
                        reviewed_by: creator.user_id,
                        reviewed_at: new Date(),
                        comments: `Auto-approved from JSON import - ${item.cloth_id}`
                    }
                });

                imported++;
                if (imported % 10 === 0) {
                    console.log(`✅ Imported ${imported} products...`);
                }

            } catch (error) {
                errors++;
                console.error(`❌ Error importing ${item.cloth_id}:`, error.message);
            }
        }

        console.log('\n✅ ✅ ✅ IMPORT COMPLETED! ✅ ✅ ✅');
        console.log(`\n📊 Summary:`);
        console.log(`   - Total items in JSON: ${products.length}`);
        console.log(`   - Successfully imported: ${imported}`);
        console.log(`   - Skipped (no Cloudinary URL): ${skipped}`);
        console.log(`   - Errors: ${errors}`);
        console.log(`\n🎉 Products are now available on the UI as APPROVED!`);
        console.log(`\n⚠️  NOTE: ${skipped} products were skipped because they only have local image paths.`);
        console.log(`   To import these, you need to:`);
        console.log(`   1. Upload images from 'train_image/' folder to Cloudinary`);
        console.log(`   2. Add 'cloudinary_url' or 'image_url' field to each JSON item`);

    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the import
importProductsFromJSON()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed');
        process.exit(1);
    });
