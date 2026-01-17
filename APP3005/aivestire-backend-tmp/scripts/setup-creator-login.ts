import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function setupCreatorLogin() {
    console.log('\n🔐 Setting up Creator Login\n');

    try {
        // Find the creator with products
        const creator = await prisma.creator.findFirst({
            where: {
                products: {
                    some: {},
                },
            },
            include: {
                user: true,
                _count: {
                    select: { products: true },
                },
            },
        });

        if (!creator) {
            console.log('❌ No creator with products found');
            return;
        }

        console.log('✅ Found Creator Account:');
        console.log('='.repeat(60));
        console.log(`Email: ${creator.user.email}`);
        console.log(`Store Name: ${creator.store_name}`);
        console.log(`Total Products: ${creator._count.products}`);
        console.log('');

        // Set a simple password for testing
        const testPassword = 'creator123';
        const hashedPassword = await bcrypt.hash(testPassword, 10);

        await prisma.user.update({
            where: { user_id: creator.user_id },
            data: { password_hash: hashedPassword },
        });

        console.log('✅ Password has been set!');
        console.log('='.repeat(60));
        console.log('');
        console.log('📝 LOGIN CREDENTIALS:');
        console.log('');
        console.log(`   Email:    ${creator.user.email}`);
        console.log(`   Password: ${testPassword}`);
        console.log('');
        console.log('='.repeat(60));
        console.log('');
        console.log('🌐 To login:');
        console.log('   1. Go to: http://localhost:5173/creator-login');
        console.log('   2. Use the credentials above');
        console.log('   3. Check your dashboard to see all 47 products!');
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

setupCreatorLogin();
