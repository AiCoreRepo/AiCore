import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // Add WALLET to PaymentMethod enum in PostgreSQL
        await prisma.$executeRawUnsafe(`ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'WALLET';`);
        console.log('Successfully added WALLET to PaymentMethod enum in database.');
    } catch (e) {
        console.error('Error modifying enum:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
