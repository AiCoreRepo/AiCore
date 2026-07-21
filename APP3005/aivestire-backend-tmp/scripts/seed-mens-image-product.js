/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { v2: cloudinary } = require('cloudinary');

if (typeof process.loadEnvFile === 'function') {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
}

const prisma = new PrismaClient();

const IMAGE_CANDIDATES = [
  process.env.MENS_PRODUCT_IMAGE_PATH,
  '/app/seed/mens/image.png',
  path.resolve(__dirname, '..', 'seed', 'mens', 'image.png'),
  path.resolve(__dirname, '..', '..', '..', 'image.png'),
].filter(Boolean);
const IMAGE_PATH = IMAGE_CANDIDATES.find((candidate) => fs.existsSync(candidate));
const PRODUCT_SLUG = process.env.MENS_PRODUCT_SLUG || 'mens-casual-layered-shirt-look';
const PRODUCT_TITLE = process.env.MENS_PRODUCT_TITLE || 'Men Casual Layered Shirt Look';
const PRODUCT_CATEGORY = process.env.MENS_PRODUCT_CATEGORY || 'Menswear';
const PRODUCT_PRICE_CENTS = Number.parseInt(process.env.MENS_PRODUCT_PRICE_CENTS || '249900', 10);
const PRODUCT_INVENTORY = Number.parseInt(process.env.MENS_PRODUCT_INVENTORY || '50', 10);
const PRODUCT_DESCRIPTION =
  process.env.MENS_PRODUCT_DESCRIPTION ||
  'A clean menswear look with a relaxed overshirt, white tee, tapered trousers, and casual sneakers.';

const CREATOR_EMAIL = process.env.MENS_PRODUCT_CREATOR_EMAIL || 'mens-collection@aivestire.local';
const CREATOR_STORE_NAME = process.env.MENS_PRODUCT_CREATOR_STORE_NAME || 'Aivestire Mens Collection';
const CREATOR_STORE_SLUG = process.env.MENS_PRODUCT_CREATOR_STORE_SLUG || 'aivestire-mens-collection';

function requireEnv(name) {
  if (!process.env[name]) {
    throw new Error(`${name} is required in APP3005/aivestire-backend-tmp/.env`);
  }
}

function configureCloudinary() {
  requireEnv('CLOUDINARY_CLOUD_NAME');
  requireEnv('CLOUDINARY_API_KEY');
  requireEnv('CLOUDINARY_API_SECRET');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

async function ensureCreator() {
  const user = await prisma.user.upsert({
    where: { email: CREATOR_EMAIL },
    update: {
      role: 'CREATOR',
      status: 'active',
      phone_verified: true,
    },
    create: {
      email: CREATOR_EMAIL,
      role: 'CREATOR',
      status: 'active',
      phone_verified: true,
    },
  });

  return prisma.creator.upsert({
    where: { user_id: user.user_id },
    update: {
      store_name: CREATOR_STORE_NAME,
      store_slug: CREATOR_STORE_SLUG,
      verified: true,
      terms_accepted: true,
      terms_accepted_at: new Date(),
    },
    create: {
      user_id: user.user_id,
      store_name: CREATOR_STORE_NAME,
      store_slug: CREATOR_STORE_SLUG,
      verified: true,
      terms_accepted: true,
      terms_accepted_at: new Date(),
      limits: {
        create: {
          max_products: 50,
          max_images_per_product: 10,
        },
      },
    },
  });
}

async function uploadMensImage() {
  if (!IMAGE_PATH) {
    throw new Error(
      `Mens product image not found. Checked: ${IMAGE_CANDIDATES.join(', ')}`,
    );
  }

  const result = await cloudinary.uploader.upload(IMAGE_PATH, {
    folder: 'aivestire/products/mens',
    public_id: PRODUCT_SLUG,
    resource_type: 'image',
    overwrite: true,
    tags: ['aivestire', 'product', 'menswear'],
    context: {
      source: 'seed-mens-image-product',
      category: PRODUCT_CATEGORY,
      audience: 'mens',
    },
  });

  return result.secure_url;
}

async function upsertProduct(imageUrl) {
  const creator = await ensureCreator();

  const productData = {
    creator_id: creator.creator_id,
    title: PRODUCT_TITLE,
    description: PRODUCT_DESCRIPTION,
    category: PRODUCT_CATEGORY,
    price_cents: PRODUCT_PRICE_CENTS,
    commission_percentage: 10,
    currency: 'INR',
    inventory_count: PRODUCT_INVENTORY,
    status: 'APPROVED',
    is_featured: true,
    is_deleted: false,
    metadata: {
      audience: 'mens',
      gender: 'male',
      department: 'menswear',
      section: 'mens',
      style: ['Casual', 'Layered'],
      fit: ['Relaxed Fit'],
      fabric: ['Cotton Blend'],
      color: 'Blue, White, Brown',
      size: 'S, M, L, XL',
      seeded_by: 'seed-mens-image-product.js',
    },
    occasions: ['Casual', 'Travel', 'Weekend'],
    body_shapes: ['RECTANGLE', 'ATHLETIC'],
    skin_tones: ['FAIR', 'LIGHT', 'MEDIUM', 'TAN', 'BROWN', 'DEEP'],
    sizes: ['S', 'M', 'L', 'XL'],
  };

  const existing = await prisma.product.findUnique({
    where: { slug: PRODUCT_SLUG },
    select: { product_id: true },
  });

  let product;
  if (existing) {
    product = await prisma.product.update({
      where: { product_id: existing.product_id },
      data: productData,
    });
    await prisma.productImage.deleteMany({
      where: { product_id: product.product_id },
    });
  } else {
    product = await prisma.product.create({
      data: {
        ...productData,
        slug: PRODUCT_SLUG,
      },
    });
  }

  await prisma.productImage.create({
    data: {
      product_id: product.product_id,
      url: imageUrl,
      order_index: 0,
      is_primary: true,
    },
  });

  await prisma.productStat.upsert({
    where: { product_id: product.product_id },
    update: {},
    create: {
      product_id: product.product_id,
      views: 0,
      likes_count: 0,
      comments_count: 0,
    },
  });

  return product;
}

async function main() {
  configureCloudinary();
  console.log(`Uploading mens product image: ${IMAGE_PATH}`);
  const imageUrl = await uploadMensImage();
  const product = await upsertProduct(imageUrl);

  console.log('');
  console.log('Mens product is ready.');
  console.log(`Product ID: ${product.product_id}`);
  console.log(`Title     : ${PRODUCT_TITLE}`);
  console.log(`Slug      : ${PRODUCT_SLUG}`);
  console.log(`Category  : ${PRODUCT_CATEGORY}`);
  console.log(`Image URL : ${imageUrl}`);
  console.log('');
}

main()
  .catch((error) => {
    console.error('Failed to seed mens product:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
