const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function importProductsFromExcel() {
    try {
        console.log('📊 Starting product import from Excel...');

        // Construct path
        const excelPath = path.join(__dirname, '../src/DataImport/personA_100_rows (2).xlsx');
        console.log(`📁 Target Excel file: ${excelPath}`);

        // Verify file exists
        if (!fs.existsSync(excelPath)) {
            console.error(`❌ File not found at path: ${excelPath}`);
            return;
        }

        const workbook = XLSX.readFile(excelPath);
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('Invalid Excel file: No sheets found');
        }

        const sheetName = workbook.SheetNames[0];
        console.log(`📄 Using sheet: ${sheetName}`);

        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ Found ${data.length} rows in Excel file\n`);

        // Get creator user (admin or first user)
        let creator = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!creator) {
            console.log('⚠️ No ADMIN user found, looking for any user...');
            creator = await prisma.user.findFirst();
        }

        if (!creator) {
            console.error('❌ No users found in database. Please create a user first.');
            return;
        }

        // Check if Creator profile exists for this user, if not create one (required for Product.creator relation)
        let creatorProfile = await prisma.creator.findUnique({
            where: { user_id: creator.user_id }
        });

        if (!creatorProfile) {
            // Check if store_slug taken
            const slug = `store-${creator.user_id.substring(0, 8)}`;
            console.log(`Creating Creator profile for user ${creator.email}...`);
            creatorProfile = await prisma.creator.create({
                data: {
                    user_id: creator.user_id,
                    store_name: "Imported Store",
                    store_slug: slug,
                    verified: true
                }
            });
        }

        console.log(`👤 Using Creator ID: ${creatorProfile.creator_id} (User: ${creator.email})\n`);
        console.log('🚀 Starting import...\n');

        let imported = 0;
        let skipped = 0;
        let errors = 0;

        for (const row of data) {
            try {
                // Map columns
                const cloudinaryUrl = row['Cloudinary URL'] || row['cloudinary_url'] || row['Image URL'] || row['image_url'] || row['Cloudinary Link'] || row['link'];

                if (!cloudinaryUrl) {
                    process.stdout.write('s');
                    skipped++;
                    continue;
                }

                const name = row['Product Name'] || row['name'] || row['Title'] || `Product ${imported + 1}`;
                const description = row['Description'] || row['description'] || 'Imported product';
                const priceMatch = (row['Price']?.toString() || '0').replace(/[^0-9.]/g, '');
                const price = parseFloat(priceMatch) || 0;
                const priceCents = Math.round(price * 100); // Store as cents

                // Generate slug
                let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(7);

                const product = await prisma.product.create({
                    data: {
                        creator_id: creatorProfile.creator_id,
                        title: name,
                        slug: slug,
                        description: description,
                        price_cents: priceCents,
                        currency: 'INR',
                        category: row['Category'] || row['category'] || 'General',
                        status: 'APPROVED',
                        inventory_count: parseInt(row['Stock'] || row['stock_quantity'] || 100),
                        metadata: {
                            gender: row['Gender'] || row['gender'] || 'UNISEX',
                            brand: row['Brand'] || row['brand'] || 'Aivestire',
                            material: row['Material'] || row['material'],
                            color: row['Color'] || row['color'],
                            size: row['Size'] || row['size']
                        }
                    }
                });

                // Create ProductImage
                await prisma.productImage.create({
                    data: {
                        product_id: product.product_id,
                        url: cloudinaryUrl,
                        is_primary: true,
                        order_index: 0
                    }
                });

                // Create ProductApproval
                await prisma.productApproval.create({
                    data: {
                        product_id: product.product_id,
                        status: 'APPROVED',
                        admin_user_id: creator.user_id, // reviewed by admin
                        comment: 'Auto-approved from Excel import'
                    }
                });

                process.stdout.write('.');
                imported++;

            } catch (error) {
                process.stdout.write('E');
                errors++;
                // console.error(`Error details: ${error.message}`);
            }
        }

        console.log('\n\n✅ ✅ ✅ IMPORT COMPLETED! ✅ ✅ ✅');
        console.log(`\n📊 Summary:`);
        console.log(`   - Total rows: ${data.length}`);
        console.log(`   - Successfully imported: ${imported}`);
        console.log(`   - Skipped (no URL): ${skipped}`);
        console.log(`   - Errors: ${errors}`);

    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error);
    } finally {
        await prisma.$disconnect();
    }
}

importProductsFromExcel();
