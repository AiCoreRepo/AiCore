import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUserAuras() {
    console.log('✨ Starting user aura cleanup...\n');

    try {
        // Get count before deletion
        const auraCount = await prisma.aura.count();

        console.log(`📊 Current Aura count: ${auraCount}\n`);

        if (auraCount === 0) {
            console.log('✅ No auras to delete.');
            return;
        }

        console.log('🗑️  Deleting all user auras...');

        const deleteResult = await prisma.aura.deleteMany({});

        console.log(`\n✅ Cleanup completed successfully!`);
        console.log(`   - Deleted ${deleteResult.count} auras`);
        console.log(`   - All related aura data removed\n`);

    } catch (error) {
        console.error('❌ Error during aura cleanup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the cleanup
deleteUserAuras()
    .then(() => {
        console.log('✨ Aura cleanup script finished.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Aura cleanup script failed:', error);
        process.exit(1);
    });
