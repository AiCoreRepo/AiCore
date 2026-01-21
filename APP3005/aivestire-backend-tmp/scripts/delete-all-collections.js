const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllCollectionsAndProducts() {
    try {
        console.log('🗑️  Starting comprehensive deletion of all collections, products, and related data...\n');

        // Step 1: Delete TryOns (references Product and Aura)
        console.log('Deleting TryOns...');
        const deletedTryOns = await prisma.tryOn.deleteMany({});
        console.log(`✅ Deleted ${deletedTryOns.count} try-ons`);

        // Step 2: Delete ProductStats (references Product)
        console.log('Deleting ProductStats...');
        const deletedProductStats = await prisma.productStat.deleteMany({});
        console.log(`✅ Deleted ${deletedProductStats.count} product stats`);

        // Step 3: Delete ProductImages (child of Product)
        console.log('Deleting ProductImages...');
        const deletedProductImages = await prisma.productImage.deleteMany({});
        console.log(`✅ Deleted ${deletedProductImages.count} product images`);

        // Step 4: Delete ApprovalLogs (child of ProductApproval)
        console.log('Deleting ApprovalLogs...');
        const deletedApprovalLogs = await prisma.approvalLog.deleteMany({});
        console.log(`✅ Deleted ${deletedApprovalLogs.count} approval logs`);

        // Step 5: Delete ProductApprovals (references Product)
        console.log('Deleting ProductApprovals...');
        const deletedProductApprovals = await prisma.productApproval.deleteMany({});
        console.log(`✅ Deleted ${deletedProductApprovals.count} product approvals`);

        // Step 6: Delete Products
        console.log('Deleting Products...');
        const deletedProducts = await prisma.product.deleteMany({});
        console.log(`✅ Deleted ${deletedProducts.count} products`);

        // Step 7: Delete Collections
        console.log('Deleting Collections...');
        const deletedCollections = await prisma.collection.deleteMany({});
        console.log(`✅ Deleted ${deletedCollections.count} collections`);

        console.log('\n✅ ✅ ✅ ALL COLLECTIONS AND PRODUCTS DELETED SUCCESSFULLY! ✅ ✅ ✅');
        console.log('\n📊 Summary:');
        console.log(`   - Collections: ${deletedCollections.count}`);
        console.log(`   - Products: ${deletedProducts.count}`);
        console.log(`   - Product Images: ${deletedProductImages.count}`);
        console.log(`   - Product Stats: ${deletedProductStats.count}`);
        console.log(`   - Product Approvals: ${deletedProductApprovals.count}`);
        console.log(`   - Approval Logs: ${deletedApprovalLogs.count}`);
        console.log(`   - Try-Ons: ${deletedTryOns.count}`);

        console.log('\n⚠️  IMPORTANT: Manual Cloudinary Cleanup Required');
        console.log('   You still need to delete images from Cloudinary:');
        console.log('   1. Go to https://cloudinary.com/console');
        console.log('   2. Log in with account: dxfxicebq');
        console.log('   3. Navigate to Media Library');
        console.log('   4. Select all collection/product images');
        console.log('   5. Click Delete button');
        console.log('\n💡 Tip: Use folders in Cloudinary to organize images for easier bulk deletion');

    } catch (error) {
        console.error('\n❌ ERROR OCCURRED:', error.message);
        console.error('\nFull error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the deletion
deleteAllCollectionsAndProducts()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed - see error above');
        process.exit(1);
    });
