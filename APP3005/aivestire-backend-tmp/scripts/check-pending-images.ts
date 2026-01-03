import { PrismaClient, ProductStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking PENDING products and their images...\n');

    const pendingProducts = await prisma.product.findMany({
        where: {
            status: ProductStatus.PENDING,
            is_deleted: false,
        },
        include: {
            images: true,
            creator: {
                select: {
                    store_name: true,
                },
            },
        },
    });

    console.log(`Found ${pendingProducts.length} PENDING products:\n`);

    pendingProducts.forEach((p, index) => {
        console.log(`${index + 1}. ${p.title}`);
        console.log(`   Product ID: ${p.product_id}`);
        console.log(`   Creator: ${p.creator.store_name}`);
        console.log(`   Total Images: ${p.images.length}`);

        if (p.images.length > 0) {
            p.images.forEach((img, imgIndex) => {
                console.log(`   Image ${imgIndex + 1}:`);
                console.log(`     - URL: ${img.url}`);
                console.log(`     - Primary: ${img.is_primary}`);
                console.log(`     - Order: ${img.order_index}`);
            });
        } else {
            console.log(`   ⚠️  NO IMAGES FOUND`);
        }
        console.log('');
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
