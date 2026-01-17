import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProducts() {
    console.log('\n📊 Checking Product Database Status\n');
    console.log('='.repeat(60));

    try {
        // Count total products
        const totalProducts = await prisma.product.count();
        console.log(`\nTotal products in database: ${totalProducts}`);

        // Count by status
        const draftCount = await prisma.product.count({ where: { status: 'DRAFT' } });
        const pendingCount = await prisma.product.count({ where: { status: 'PENDING' } });
        const approvedCount = await prisma.product.count({ where: { status: 'APPROVED' } });
        const rejectedCount = await prisma.product.count({ where: { status: 'REJECTED' } });

        console.log(`\nBy Status:`);
        console.log(`  - DRAFT: ${draftCount}`);
        console.log(`  - PENDING: ${pendingCount}`);
        console.log(`  - APPROVED: ${approvedCount}`);
        console.log(`  - REJECTED: ${rejectedCount}`);

        // Count deleted
        const deletedCount = await prisma.product.count({ where: { is_deleted: true } });
        const activeCount = await prisma.product.count({ where: { is_deleted: false } });

        console.log(`\nBy Deletion Status:`);
        console.log(`  - Active (is_deleted=false): ${activeCount}`);
        console.log(`  - Deleted (is_deleted=true): ${deletedCount}`);

        // Show first 10 products
        const products = await prisma.product.findMany({
            take: 10,
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

        if (products.length > 0) {
            console.log(`\nFirst 10 Products:`);
            console.log('='.repeat(60));
            products.forEach((p, i) => {
                console.log(`${i + 1}. ${p.title}`);
                console.log(`   ID: ${p.product_id}`);
                console.log(`   Status: ${p.status}`);
                console.log(`   Deleted: ${p.is_deleted}`);
                console.log(`   Created: ${p.created_at.toLocaleDateString()}`);
                console.log('');
            });
        }

        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkProducts();
