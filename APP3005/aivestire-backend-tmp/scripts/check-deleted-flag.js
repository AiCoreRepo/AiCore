const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking APPROVED products with is_deleted flag...\n');
    
    try {
        // Count approved products by is_deleted status
        const deletedCount = await prisma.product.count({
            where: { 
                status: 'APPROVED',
                is_deleted: true 
            }
        });
        
        const notDeletedCount = await prisma.product.count({
            where: { 
                status: 'APPROVED',
                is_deleted: false 
            }
        });
        
        console.log('APPROVED Products:');
        console.log(`  - is_deleted: false → ${notDeletedCount} products`);
        console.log(`  - is_deleted: true → ${deletedCount} products`);
        console.log('');
        
        // Get sample of approved, not deleted products
        const activeProducts = await prisma.product.findMany({
            where: { 
                status: 'APPROVED',
                is_deleted: false 
            },
            take: 5,
            select: { 
                title: true, 
                product_id: true,
                is_deleted: true,
                status: true,
                category: true
            }
        });
        
        console.log('Sample Active Products (APPROVED + not deleted):');
        console.log(JSON.stringify(activeProducts, null, 2));
        
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
