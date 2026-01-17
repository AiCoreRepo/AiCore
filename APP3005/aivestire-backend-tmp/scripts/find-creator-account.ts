import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findCreatorAccounts() {
    console.log('\n🔍 Finding Creator Accounts\n');
    console.log('='.repeat(60));

    try {
        // Find all creators with their user info
        const creators = await prisma.creator.findMany({
            include: {
                user: {
                    select: {
                        user_id: true,
                        email: true,
                        role: true,
                        created_at: true,
                    },
                },
                _count: {
                    select: {
                        products: true,
                    },
                },
            },
        });

        if (creators.length === 0) {
            console.log('❌ No creator accounts found');
            return;
        }

        console.log(`\n✅ Found ${creators.length} creator account(s):\n`);

        creators.forEach((creator, index) => {
            console.log(`${index + 1}. Creator Account`);
            console.log('   ' + '-'.repeat(50));
            console.log(`   Creator ID: ${creator.creator_id}`);
            console.log(`   User ID: ${creator.user_id}`);
            console.log(`   Email: ${creator.user.email}`);
            console.log(`   Store Name: ${creator.store_name}`);
            console.log(`   Store Slug: ${creator.store_slug}`);
            console.log(`   Products: ${creator._count.products}`);
            console.log(`   Created: ${creator.created_at.toLocaleDateString()}`);
            console.log('');
        });

        // Find the creator with the most products (likely the one we just imported to)
        const mainCreator = creators.reduce((prev, current) =>
            (current._count.products > prev._count.products) ? current : prev
        );

        console.log('='.repeat(60));
        console.log('📌 MAIN CREATOR ACCOUNT (Most Products):');
        console.log('='.repeat(60));
        console.log(`Email: ${mainCreator.user.email}`);
        console.log(`Store: ${mainCreator.store_name}`);
        console.log(`Products: ${mainCreator._count.products}`);
        console.log('');
        console.log('⚠️  NOTE: You need to know the password to login.');
        console.log('If you don\'t have the password, you can reset it or create a new creator.');
        console.log('='.repeat(60) + '\n');

        // Show sample products from this creator
        const sampleProducts = await prisma.product.findMany({
            where: {
                creator_id: mainCreator.creator_id,
            },
            take: 5,
            select: {
                product_id: true,
                title: true,
                category: true,
                status: true,
                price_cents: true,
                images: {
                    take: 1,
                    select: {
                        url: true,
                    },
                },
            },
        });

        if (sampleProducts.length > 0) {
            console.log('📦 Sample Products from this Creator:\n');
            sampleProducts.forEach((product, index) => {
                console.log(`${index + 1}. ${product.title}`);
                console.log(`   Category: ${product.category}`);
                console.log(`   Price: ₹${product.price_cents / 100}`);
                console.log(`   Status: ${product.status}`);
                console.log(`   Image: ${product.images[0]?.url || 'No image'}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findCreatorAccounts();
