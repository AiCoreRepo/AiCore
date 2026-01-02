import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTryOnUserIds() {
    console.log('🔍 Checking TryOn table user_id values...\n');

    // Get all try-ons with their user_ids
    const tryOns = await prisma.tryOn.findMany({
        select: {
            try_on_id: true,
            user_id: true,
            created_at: true,
        },
        orderBy: { created_at: 'desc' },
        take: 20,
    });

    console.log(`📊 Found ${tryOns.length} try-ons (showing last 20):\n`);

    // Group by user_id
    const userGroups = new Map<string, number>();

    tryOns.forEach((tryOn, index) => {
        console.log(`${index + 1}. Try-On ID: ${tryOn.try_on_id}`);
        console.log(`   User ID: ${tryOn.user_id || 'NULL'}`);
        console.log(`   Created: ${tryOn.created_at}`);
        console.log('');

        const userId = tryOn.user_id || 'NULL';
        userGroups.set(userId, (userGroups.get(userId) || 0) + 1);
    });

    console.log('\n📈 Summary by User ID:');
    userGroups.forEach((count, userId) => {
        console.log(`   ${userId}: ${count} try-ons`);
    });

    await prisma.$disconnect();
}

checkTryOnUserIds().catch(console.error);
