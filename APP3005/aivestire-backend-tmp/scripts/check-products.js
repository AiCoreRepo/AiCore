const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking product statuses...');
    try {
        const counts = await prisma.product.groupBy({
            by: ['status'],
            _count: {
                status: true
            }
        });
        console.log('Product Counts by Status:');
        console.log(JSON.stringify(counts, null, 2));

        const approved = await prisma.product.findMany({
            where: { status: 'APPROVED' },
            take: 3,
            select: { title: true, product_id: true }
        });
        console.log('Sample Approved Products:', approved);

    } catch (error) {
        console.error('Error querying database:', error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
