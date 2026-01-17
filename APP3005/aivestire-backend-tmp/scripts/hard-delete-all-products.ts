import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Delete image from Cloudinary
 */
async function deleteFromCloudinary(imageUrl: string): Promise<boolean> {
    try {
        const urlParts = imageUrl.split('/');
        const uploadIndex = urlParts.indexOf('upload');

        if (uploadIndex === -1) {
            console.warn(`⚠️  Invalid Cloudinary URL: ${imageUrl}`);
            return false;
        }

        const pathAfterUpload = urlParts.slice(uploadIndex + 1).join('/');
        const publicIdWithExt = pathAfterUpload.replace(/^v\d+\//, '');
        const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');

        console.log(`🗑️  Deleting from Cloudinary: ${publicId}`);
        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === 'ok' || result.result === 'not found') {
            return true;
        } else {
            console.warn(`⚠️  Failed to delete from Cloudinary: ${result.result}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error deleting from Cloudinary: ${error.message}`);
        return false;
    }
}

/**
 * HARD DELETE all products (use with caution!)
 */
async function hardDeleteAllProducts() {
    console.log('\n🧹 Starting HARD DELETE of ALL products');
    console.log('='.repeat(60));
    console.log('⚠️  WARNING: This will PERMANENTLY delete ALL products!\n');

    try {
        // Fetch all products with their images
        const products = await prisma.product.findMany({
            include: {
                images: true,
            },
        });

        if (products.length === 0) {
            console.log('\n✅ No products found in database');
            return;
        }

        console.log(`\n📦 Found ${products.length} products to delete\n`);

        let deletedCount = 0;
        let failedCount = 0;
        let cloudinaryDeletedCount = 0;

        for (const product of products) {
            try {
                console.log(`\n[${deletedCount + failedCount + 1}/${products.length}] Deleting: ${product.title}`);
                console.log(`   ID: ${product.product_id}`);
                console.log(`   Images: ${product.images.length}`);

                // Step 1: Delete images from Cloudinary
                for (const image of product.images) {
                    const deleted = await deleteFromCloudinary(image.url);
                    if (deleted) {
                        cloudinaryDeletedCount++;
                    }
                }

                // Step 2: Delete related records in order (Prisma handles cascade, but being explicit)

                // Delete comments
                await prisma.productComment.deleteMany({
                    where: { product_id: product.product_id },
                });

                // Delete likes
                await prisma.productLike.deleteMany({
                    where: { product_id: product.product_id },
                });

                // Delete stats
                await prisma.productStat.deleteMany({
                    where: { product_id: product.product_id },
                });

                // Delete approvals
                await prisma.productApproval.deleteMany({
                    where: { product_id: product.product_id },
                });

                // Delete try-ons
                await prisma.tryOn.deleteMany({
                    where: { product_id: product.product_id },
                });

                // Delete images
                await prisma.productImage.deleteMany({
                    where: { product_id: product.product_id },
                });

                // Step 3: Delete the product itself
                await prisma.product.delete({
                    where: { product_id: product.product_id },
                });

                console.log(`   ✅ Deleted successfully`);
                deletedCount++;

            } catch (error) {
                console.error(`   ❌ Failed to delete: ${error.message}`);
                failedCount++;
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 CLEANUP SUMMARY');
        console.log('='.repeat(60));
        console.log(`Products deleted: ${deletedCount}`);
        console.log(`Products failed: ${failedCount}`);
        console.log(`Cloudinary images deleted: ${cloudinaryDeletedCount}`);
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the cleanup
if (require.main === module) {
    console.log('⚠️  WARNING: This will delete ALL products!');
    console.log('Press Ctrl+C within 5 seconds to cancel...\n');

    setTimeout(() => {
        hardDeleteAllProducts()
            .then(() => {
                console.log('✅ Cleanup completed successfully!');
                process.exit(0);
            })
            .catch((error) => {
                console.error('❌ Cleanup failed:', error);
                process.exit(1);
            });
    }, 5000);
}

export { hardDeleteAllProducts };
