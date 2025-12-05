import { PrismaClient, ProductStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Update all PENDING products to DRAFT
 * This is a one-time migration for the new workflow
 */
async function main() {
    console.log('🔄 Updating existing PENDING products to DRAFT...\n');

    const result = await prisma.product.updateMany({
        where: {
            status: ProductStatus.PENDING,
        },
        data: {
            status: ProductStatus.DRAFT,
        },
    });

    console.log(`✅ Updated ${result.count} products from PENDING to DRAFT\n`);
    console.log('📊 Current product status distribution:');

    const statusCounts = await prisma.product.groupBy({
        by: ['status'],
        _count: true,
    });

    statusCounts.forEach((item) => {
        console.log(`   ${item.status}: ${item._count}`);
    });

    console.log('\n✨ Migration completed!');
}

main()
    .catch((e) => {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
