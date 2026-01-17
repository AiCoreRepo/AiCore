import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

function slugify(input: string): string {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

async function uploadImageToCloudinary(imagePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        console.log(`📤 Uploading to Cloudinary: ${path.basename(imagePath)}`);

        cloudinary.uploader.upload(
            imagePath,
            {
                timeout: 120000,
                chunk_size: 6000000,
                resource_type: 'auto',
            },
            (error, result) => {
                if (error || !result) {
                    console.error(`❌ Upload failed:`, error);
                    reject(error);
                } else {
                    console.log(`✅ Uploaded: ${result.secure_url}`);
                    resolve(result.secure_url);
                }
            }
        );
    });
}

// Sample metadata for different product types
const productMetadata = [
    {
        occasions: ['Formal', 'Wedding'],
        body_shapes: ['Rectangle', 'Hourglass'],
        skin_tones: ['Light', 'Medium'],
        sizes: ['S', 'M', 'L', 'XL'],
    },
    {
        occasions: ['Party', 'Casual luxury'],
        body_shapes: ['Pear Shape', 'Hourglass'],
        skin_tones: ['Medium', 'Dusky'],
        sizes: ['M', 'L', 'XL'],
    },
    {
        occasions: ['Wedding', 'Formal'],
        body_shapes: ['Hourglass', 'Inverted Triangle'],
        skin_tones: ['Light', 'Deep'],
        sizes: ['S', 'M', 'L'],
    },
    {
        occasions: ['Resort', 'Party'],
        body_shapes: ['Rectangle', 'Apple Shape'],
        skin_tones: ['Medium', 'Dusky', 'Deep'],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
    },
];

const categories = ['Dress', 'Saree', 'Lehenga', 'Suit', 'Gown'];

async function importImages() {
    console.log('\n🎨 Starting Image Import Process');
    console.log('='.repeat(60));

    try {
        // Get or create a default creator
        let creator = await prisma.creator.findFirst({
            where: { user: { role: 'CREATOR' } },
        });

        if (!creator) {
            console.log('⚠️  No creator found. Creating default creator...');

            // Create a default user and creator
            const user = await prisma.user.create({
                data: {
                    email: 'creator@gmail.com',
                    password_hash: '$2b$10$EpRnTzVlqHNP0.fkbAy9kuly.fRMobvG3l.yQbuO9.y.0.y.0.y.', // dummy hash, will update later
                    role: 'CREATOR',
                },
            });

            creator = await prisma.creator.create({
                data: {
                    user_id: user.user_id,
                    store_name: 'Creator Store',
                    store_slug: 'creator-store',
                    about: 'Default collection of fashion items',
                },
            });

            console.log(`✅ Created default creator: ${creator.creator_id}`);
        } else {
            console.log(`✅ Using existing creator: ${creator.creator_id}`);
        }

        const imagesDir = path.join(__dirname, '..', 'images', 'AtulImages');
        const imageFiles = fs.readdirSync(imagesDir)
            .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));

        console.log(`\n📁 Found ${imageFiles.length} images in ${imagesDir}\n`);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < imageFiles.length; i++) {
            const fileName = imageFiles[i];
            const filePath = path.join(imagesDir, fileName);

            try {
                console.log(`\n[${i + 1}/${imageFiles.length}] Processing: ${fileName}`);

                // Upload to Cloudinary
                const imageUrl = await uploadImageToCloudinary(filePath);

                // Generate product details
                const productName = fileName.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '').replace(/[_-]/g, ' ');
                const title = productName.charAt(0).toUpperCase() + productName.slice(1);

                // Generate unique slug
                const baseSlug = slugify(title);
                let slug = baseSlug;
                let j = 1;
                while (await prisma.product.findUnique({ where: { slug } })) {
                    slug = `${baseSlug}-${j++}`;
                }

                // Random metadata
                const metadata = productMetadata[i % productMetadata.length];
                const category = categories[i % categories.length];
                const price = Math.floor(Math.random() * 5000) + 2000; // 2000-7000 INR

                // Create product
                const product = await prisma.product.create({
                    data: {
                        title,
                        slug,
                        description: `Beautiful ${category.toLowerCase()} perfect for ${metadata.occasions.join(', ')}`,
                        price_cents: price * 100,
                        currency: 'INR',
                        category,
                        creator_id: creator.creator_id,
                        status: 'PENDING', // Set to PENDING for admin approval
                        metadata: metadata as any, // Cast to any for Prisma JSON type
                        images: {
                            create: {
                                url: imageUrl,
                                is_primary: true,
                                order_index: 0,
                            },
                        },
                    },
                });

                console.log(`✅ Created product: ${product.title} (${product.product_id})`);
                successCount++;

            } catch (error) {
                console.error(`❌ Failed to import ${fileName}:`, error.message);
                failCount++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 IMPORT SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Successfully imported: ${successCount} products`);
        console.log(`❌ Failed: ${failCount} products`);
        console.log(`📦 Total images processed: ${imageFiles.length}`);
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('❌ Import failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the import
if (require.main === module) {
    console.log('🚀 Image Import Script');
    console.log('This will import all images from images/AtulImages folder\n');

    importImages()
        .then(() => {
            console.log('✅ Import completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Import failed:', error);
            process.exit(1);
        });
}

export { importImages };
