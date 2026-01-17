import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function deleteAllCloudinaryImages() {
    console.log('\n🗑️  Deleting all images from Cloudinary...');

    try {
        // Get all resources from Cloudinary
        const result = await cloudinary.api.resources({
            type: 'upload',
            max_results: 500,
        });

        if (result.resources.length === 0) {
            console.log('   No images found in Cloudinary');
            return;
        }

        console.log(`   Found ${result.resources.length} images`);

        // Delete all resources
        for (const resource of result.resources) {
            try {
                await cloudinary.uploader.destroy(resource.public_id);
                console.log(`   ✅ Deleted: ${resource.public_id}`);
            } catch (error) {
                console.error(`   ❌ Failed to delete ${resource.public_id}:`, error.message);
            }
        }

        console.log('   ✅ Cloudinary cleanup complete');
    } catch (error) {
        console.error('   ⚠️  Cloudinary cleanup failed:', error.message);
        console.log('   Continuing with database cleanup...');
    }
}

async function resetDatabase() {
    console.log('\n🔄 DATABASE RESET SCRIPT');
    console.log('='.repeat(60));
    console.log('⚠️  WARNING: This will delete ALL data from the database!');
    console.log('='.repeat(60));

    try {
        // Delete all images from Cloudinary first
        await deleteAllCloudinaryImages();

        console.log('\n🗑️  Deleting all data from database...\n');

        // Delete in correct order to respect foreign key constraints

        // 1. Delete TryOns
        const tryOns = await prisma.tryOn.deleteMany({});
        console.log(`   ✅ Deleted ${tryOns.count} try-ons`);

        // 2. Delete ProductComments
        const comments = await prisma.productComment.deleteMany({});
        console.log(`   ✅ Deleted ${comments.count} product comments`);

        // 3. Delete ProductLikes
        const likes = await prisma.productLike.deleteMany({});
        console.log(`   ✅ Deleted ${likes.count} product likes`);

        // 4. Delete ProductStats
        const stats = await prisma.productStat.deleteMany({});
        console.log(`   ✅ Deleted ${stats.count} product stats`);

        // 5. Delete ApprovalLogs (must be before ProductApprovals)
        const approvalLogs = await prisma.approvalLog.deleteMany({});
        console.log(`   ✅ Deleted ${approvalLogs.count} approval logs`);

        // 6. Delete ProductApprovals
        const approvals = await prisma.productApproval.deleteMany({});
        console.log(`   ✅ Deleted ${approvals.count} product approvals`);

        // 7. Delete ProductImages
        const images = await prisma.productImage.deleteMany({});
        console.log(`   ✅ Deleted ${images.count} product images`);

        // 8. Delete Products
        const products = await prisma.product.deleteMany({});
        console.log(`   ✅ Deleted ${products.count} products`);

        // 8. Delete Auras
        const auras = await prisma.aura.deleteMany({});
        console.log(`   ✅ Deleted ${auras.count} auras`);

        // 9. Delete Creators
        const creators = await prisma.creator.deleteMany({});
        console.log(`   ✅ Deleted ${creators.count} creators`);

        // 10. Delete Users
        const users = await prisma.user.deleteMany({});
        console.log(`   ✅ Deleted ${users.count} users`);

        console.log('\n' + '='.repeat(60));
        console.log('✅ DATABASE RESET COMPLETE');
        console.log('='.repeat(60));
        console.log('\nThe database is now empty and ready for fresh data!');
        console.log('You can now:');
        console.log('  1. Create new users and creators');
        console.log('  2. Import products again');
        console.log('  3. Start fresh with bulk upload');
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('\n❌ Reset failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the reset
if (require.main === module) {
    console.log('\n⚠️  DANGER ZONE: Database Reset');
    console.log('This will delete ALL data including:');
    console.log('  - All users and creators');
    console.log('  - All products and images');
    console.log('  - All try-ons and auras');
    console.log('  - All comments, likes, and stats');
    console.log('  - All images from Cloudinary');
    console.log('\nPress Ctrl+C within 5 seconds to cancel...\n');

    setTimeout(() => {
        resetDatabase()
            .then(() => {
                console.log('✅ Reset completed successfully!');
                process.exit(0);
            })
            .catch((error) => {
                console.error('❌ Reset failed:', error);
                process.exit(1);
            });
    }, 5000);
}

export { resetDatabase };
