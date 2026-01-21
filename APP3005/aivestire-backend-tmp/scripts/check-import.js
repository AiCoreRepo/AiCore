const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkImport() {
    const count = await prisma.product.count();
    console.log(`Total Products: ${count}`);

    const collections = await prisma.collection.findMany({
        include: {
            _count: {
                select: { products: true }
            }
        }
    });
    console.log('Collections:', JSON.stringify(collections, null, 2));

    // Check approved products
    const approved = await prisma.productApproval.count({
        where: { status: 'APPROVED' }
    });
    console.log(`Approved Products: ${approved}`);
}

checkImport()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
