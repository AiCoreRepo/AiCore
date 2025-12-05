import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking product statuses for non-deleted products...\n');

    const products = await prisma.product.findMany({
        where: {
            is_deleted: false,
        },
        select: {
            product_id: true,
            title: true,
            status: true,
            is_deleted: true,
            created_at: true,
        },
        orderBy: {
            created_at: 'desc',
        },
    });

    console.log(`Found ${products.length} non-deleted products:\n`);

    products.forEach((p, index) => {
        console.log(`${index + 1}. ${p.title}`);
        console.log(`   ID: ${p.product_id}`);
        console.log(`   Status: ${p.status}`);
        console.log(`   Created: ${p.created_at}`);
        console.log('');
    });

    const statusCounts = await prisma.product.groupBy({
        by: ['status', 'is_deleted'],
        _count: true,
    });

    console.log('\n📊 Status distribution (all products):');
    statusCounts.forEach((item) => {
        console.log(`   ${item.status} (deleted: ${item.is_deleted}): ${item._count}`);
    });
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
