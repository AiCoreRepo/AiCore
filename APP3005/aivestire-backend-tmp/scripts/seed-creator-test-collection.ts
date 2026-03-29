import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Configure Cloudinary from existing env vars
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

// Dummy configurations for mock products
const productMetadata = [
  {
    occasions: ['Formal', 'Wedding', 'Festive'],
    body_shapes: ['Hourglass', 'Rectangle'],
    skin_tones: ['Light', 'Medium', 'Dusky'],
    sizes: ['S', 'M', 'L'],
  },
  {
    occasions: ['Party', 'Casual luxury', 'Cocktail'],
    body_shapes: ['Pear Shape', 'Full Bust'],
    skin_tones: ['Medium', 'Deep'],
    sizes: ['XS', 'S', 'M', 'L'],
  },
];
const categories = ['Dress', 'Gown', 'Lehenga', 'Suit'];

async function seedCreatorAndProducts() {
  console.log('\n🌟 Starting Creator & Product Seeding Process');
  console.log('='.repeat(60));

  try {
    const email = 'demo.creator2026@gmail.com';
    const phone = '+919876543210';
    const password = 'CreatorPassword123!';
    
    // 1. Create or Find User
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      console.log(`👤 Creating new user account for ${email}...`);
      const password_hash = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email,
          phone,
          password_hash,
          role: 'CREATOR',
          status: 'active',
          phone_verified: true,
        },
      });
      console.log(`✅ User created! ID: ${user.user_id}`);
    } else {
      console.log(`✅ Using existing user account for ${email}`);
    }

    // 2. Create or Find Creator Profile
    let creator = await prisma.creator.findUnique({ where: { user_id: user.user_id } });
    
    if (!creator) {
      console.log(`🏬 Setting up Creator Store Profile...`);
      creator = await prisma.creator.create({
        data: {
          user_id: user.user_id,
          store_name: 'The Elite Collection',
          store_slug: 'the-elite-collection',
          about: 'Exclusive high-end fashion pieces sourced globally for the modern aesthetic.',
          verified: true,
          terms_accepted: true,
          terms_accepted_at: new Date(),
          limits: {
            create: {
              max_products: 100,
              max_images_per_product: 10,
            }
          }
        },
      });
      console.log(`✅ Creator profile established! Store: ${creator.store_name}`);
    } else {
      console.log(`✅ Using existing Creator Profile: ${creator.store_name}`);
    }

    // 3. Process the Test Collection Folder
    const collectionDir = path.resolve(__dirname, '..', 'test-collection');
    
    if (!fs.existsSync(collectionDir)) {
      console.error(`❌ Directory not found: ${collectionDir}`);
      return;
    }

    const imageFiles = fs.readdirSync(collectionDir)
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
      
    console.log(`\n📁 Found ${imageFiles.length} product images in test-collection/`);

    let successCount = 0;
    let failCount = 0;

    // 4. Upload and Create Products loop
    for (let i = 0; i < imageFiles.length; i++) {
      const fileName = imageFiles[i];
      const filePath = path.join(collectionDir, fileName);

      try {
        console.log(`\n[${i + 1}/${imageFiles.length}] Processing Product: ${fileName}`);
        
        // Push image to Cloudinary
        const imageUrl = await uploadImageToCloudinary(filePath);

        // Generate Product Title based on file name
        const cleanName = fileName.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '').replace(/[_-]/g, ' ');
        // capitalize each word
        const title = cleanName.replace(/\b\w/g, c => c.toUpperCase());

        // Ensure unique slug
        let baseSlug = slugify(title);
        if (!baseSlug) baseSlug = `product-${Date.now()}`;
        
        let slug = baseSlug;
        let suffix = 1;
        while (await prisma.product.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${suffix++}`;
        }

        const category = categories[i % categories.length];
        const metadata = productMetadata[i % productMetadata.length];
        const priceCents = (Math.floor(Math.random() * 80) + 20) * 10000; // Random price between 2,000 and 10,000 INR
        
        // Write to DB
        const product = await prisma.product.create({
          data: {
            title,
            slug,
            description: `A stunning ${category.toLowerCase()} crafted with premium fabric. Perfectly tailored for a luxurious silhouette.`,
            price_cents: priceCents,
            commission_percentage: 15,
            currency: 'INR',
            inventory_count: Math.floor(Math.random() * 50) + 10, // anywhere from 10 to 60 units
            category,
            creator_id: creator.creator_id,
            status: 'APPROVED', // auto-approve so it shows on the store front immediately
            is_featured: i === 0, // Make the first one featured
            metadata: metadata as any,
            occasions: metadata.occasions,
            body_shapes: metadata.body_shapes,
            skin_tones: metadata.skin_tones,
            sizes: metadata.sizes,
            images: {
              create: {
                url: imageUrl,
                is_primary: true,
                order_index: 0,
              },
            },
          },
        });

        console.log(`✅ DB Record Created: ${product.title} (Price: ${priceCents / 100} INR)`);
        successCount++;
        
      } catch (err: any) {
        console.error(`❌ Failed processing ${fileName}:`, err?.message || err);
        failCount++;
      }
    }

    // Done!
    console.log('\n' + '='.repeat(60));
    console.log('🚀 SEEDING COMPLETE!');
    console.log('='.repeat(60));
    console.log(`Creator Email : ${email}`);
    console.log(`Password      : ${password}`);
    console.log('='.repeat(60));
    console.log(`✅ Products Successfully Uploaded : ${successCount}`);
    console.log(`❌ Products Failed               : ${failCount}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Critical Script Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedCreatorAndProducts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
