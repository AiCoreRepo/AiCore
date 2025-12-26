import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupUsers() {
    console.log('🧹 Starting user cleanup...\n');

    try {
        // Get counts before deletion
        const creatorCount = await prisma.user.count({
            where: { role: UserRole.CREATOR }
        });
        const buyerCount = await prisma.user.count({
            where: { role: UserRole.BUYER }
        });

        console.log(`📊 Current counts:`);
        console.log(`   - Creators: ${creatorCount}`);
        console.log(`   - Buyers: ${buyerCount}\n`);

        if (creatorCount === 0 && buyerCount === 0) {
            console.log('✅ No creators or buyers to delete.');
            return;
        }

        // Delete all creators and buyers (cascading will handle related records)
        // Thanks to onDelete: Cascade in schema, this will automatically delete:
        // - Creator profiles
        // - Products
        // - Product images
        // - Product likes
        // - Product comments
        // - Auras
        // - Try-on history
        // - Approvals
        console.log('🗑️  Deleting creators and buyers...');

        const deleteResult = await prisma.user.deleteMany({
            where: {
                OR: [
                    { role: UserRole.CREATOR },
                    { role: UserRole.BUYER }
                ]
            }
        });

        console.log(`\n✅ Cleanup completed successfully!`);
        console.log(`   - Deleted ${deleteResult.count} users`);
        console.log(`   - All related records automatically deleted via cascade\n`);

        // Verify deletion
        const remainingCreators = await prisma.user.count({
            where: { role: UserRole.CREATOR }
        });
        const remainingBuyers = await prisma.user.count({
            where: { role: UserRole.BUYER }
        });
        const remainingAdmins = await prisma.user.count({
            where: { role: UserRole.ADMIN }
        });

        console.log(`📊 Final counts:`);
        console.log(`   - Creators: ${remainingCreators}`);
        console.log(`   - Buyers: ${remainingBuyers}`);
        console.log(`   - Admins: ${remainingAdmins} (preserved)\n`);

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the cleanup
cleanupUsers()
    .then(() => {
        console.log('✨ Cleanup script finished.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Cleanup script failed:', error);
        process.exit(1);
    });
