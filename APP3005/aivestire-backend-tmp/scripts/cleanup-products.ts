import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CleanupOptions {
    olderThanDays?: number;
    status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
    deleteAll?: boolean;
    dryRun?: boolean;
}

/**
 * Delete image from Cloudinary
 */
async function deleteFromCloudinary(imageUrl: string): Promise<boolean> {
    try {
        // Extract public_id from Cloudinary URL
        // URL format: https://res.cloudinary.com/cloud-name/image/upload/v123456/folder/image-id.jpg
        const urlParts = imageUrl.split('/');
        const uploadIndex = urlParts.indexOf('upload');

        if (uploadIndex === -1) {
            console.warn(`⚠️  Invalid Cloudinary URL: ${imageUrl}`);
            return false;
        }

        // Get everything after 'upload/vXXXXXX/' or 'upload/'
        const pathAfterUpload = urlParts.slice(uploadIndex + 1).join('/');
        // Remove version number if present (v123456/)
        const publicIdWithExt = pathAfterUpload.replace(/^v\d+\//, '');
        // Remove file extension
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
 * Clean up old products
 */
async function cleanupProducts(options: CleanupOptions = {}) {
    const {
        olderThanDays,
        status,
        deleteAll = false,
        dryRun = false,
    } = options;

    console.log('\n🧹 Starting Product Cleanup');
    console.log('='.repeat(60));

    if (dryRun) {
        console.log('🔍 DRY RUN MODE - No actual deletions will occur\n');
    }

    try {
        // Build where clause
        const where: any = {};

        if (deleteAll) {
            console.log('⚠️  WARNING: Deleting ALL products!\n');
        } else {
            if (olderThanDays) {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
                where.created_at = { lt: cutoffDate };
                console.log(`📅 Deleting products older than ${olderThanDays} days (before ${cutoffDate.toLocaleDateString()})`);
            }

            if (status) {
                where.status = status;
                console.log(`📊 Filtering by status: ${status}`);
            }
        }

        // Fetch products to delete
        const products = await prisma.product.findMany({
            where,
            include: {
                images: true,
            },
        });

        if (products.length === 0) {
            console.log('\n✅ No products found matching criteria');
            return;
        }

        console.log(`\n📦 Found ${products.length} products to delete\n`);

        let deletedCount = 0;
        let failedCount = 0;
        let cloudinaryDeletedCount = 0;
        let cloudinaryFailedCount = 0;

        for (const product of products) {
            try {
                console.log(`\n[${deletedCount + failedCount + 1}/${products.length}] Processing: ${product.title}`);
                console.log(`   ID: ${product.product_id}`);
                console.log(`   Status: ${product.status}`);
                console.log(`   Created: ${product.created_at.toLocaleDateString()}`);
                console.log(`   Images: ${product.images.length}`);

                if (!dryRun) {
                    // Delete images from Cloudinary
                    for (const image of product.images) {
                        const deleted = await deleteFromCloudinary(image.url);
                        if (deleted) {
                            cloudinaryDeletedCount++;
                        } else {
                            cloudinaryFailedCount++;
                        }
                    }

                    // Delete product from database (cascade will delete images, stats, likes, comments)
                    await prisma.product.delete({
                        where: { product_id: product.product_id },
                    });

                    console.log(`   ✅ Deleted from database`);
                    deletedCount++;
                } else {
                    console.log(`   🔍 Would delete (dry run)`);
                    deletedCount++;
                }

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
        if (!dryRun) {
            console.log(`Cloudinary images deleted: ${cloudinaryDeletedCount}`);
            console.log(`Cloudinary images failed: ${cloudinaryFailedCount}`);
        }
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Dry run - see what would be deleted
 */
async function example1_DryRun() {
    await cleanupProducts({
        olderThanDays: 30,
        dryRun: true,
    });
}

/**
 * Example 2: Delete all DRAFT products older than 7 days
 */
async function example2_DeleteOldDrafts() {
    await cleanupProducts({
        olderThanDays: 7,
        status: 'DRAFT',
        dryRun: false,
    });
}

/**
 * Example 3: Delete all REJECTED products
 */
async function example3_DeleteRejected() {
    await cleanupProducts({
        status: 'REJECTED',
        dryRun: false,
    });
}

/**
 * Example 4: Delete ALL products (DANGEROUS!)
 */
async function example4_DeleteAll() {
    console.log('⚠️  WARNING: This will delete ALL products!');
    console.log('Press Ctrl+C to cancel...\n');

    // Wait 5 seconds to give user time to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));

    await cleanupProducts({
        deleteAll: true,
        dryRun: false,
    });
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
🧹 Product Cleanup Script

Usage: ts-node cleanup-products.ts [options]

Options:
  --dry-run              Preview what would be deleted (no actual deletion)
  --days <number>        Delete products older than N days
  --status <status>      Delete products with specific status (DRAFT, PENDING, APPROVED, REJECTED)
  --all                  Delete ALL products (DANGEROUS!)

Examples:
  # Dry run - see what would be deleted
  ts-node cleanup-products.ts --dry-run --days 30

  # Delete DRAFT products older than 7 days
  ts-node cleanup-products.ts --days 7 --status DRAFT

  # Delete all REJECTED products
  ts-node cleanup-products.ts --status REJECTED

  # Delete ALL products (use with caution!)
  ts-node cleanup-products.ts --all

  # Dry run for deleting all products
  ts-node cleanup-products.ts --all --dry-run
        `);
        process.exit(0);
    }

    const options: CleanupOptions = {
        dryRun: args.includes('--dry-run'),
        deleteAll: args.includes('--all'),
    };

    // Parse --days
    const daysIndex = args.indexOf('--days');
    if (daysIndex !== -1 && args[daysIndex + 1]) {
        options.olderThanDays = parseInt(args[daysIndex + 1], 10);
    }

    // Parse --status
    const statusIndex = args.indexOf('--status');
    if (statusIndex !== -1 && args[statusIndex + 1]) {
        options.status = args[statusIndex + 1] as any;
    }

    cleanupProducts(options)
        .then(() => {
            console.log('✅ Cleanup completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Cleanup failed:', error);
            process.exit(1);
        });
}

export { cleanupProducts };
