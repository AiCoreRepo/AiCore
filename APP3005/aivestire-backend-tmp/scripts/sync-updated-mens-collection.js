/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { v2: cloudinary } = require('cloudinary');

if (typeof process.loadEnvFile === 'function') {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) process.loadEnvFile(envPath);
}

const prisma = new PrismaClient();
const sourceRoot = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'assets',
  'male_updated_collection',
);

const PROTECTED_SLUGS = [
  'male-collection-look-1',
  'male-collection-look-2',
  'male-collection-look-3',
];

const PRODUCTS = [
  {
    file: 'item01.jpeg',
    slug: 'chocolate-brown-relaxed-shirt',
    title: 'Chocolate Brown Relaxed Shirt',
    description: 'A chocolate brown open-collar shirt styled with relaxed ivory trousers.',
    category: 'Casualwear',
    color: 'Chocolate Brown, Ivory',
  },
  {
    file: 'item02.jpeg',
    slug: 'espresso-evening-shirt',
    title: 'Espresso Evening Shirt',
    description: 'A rich espresso shirt paired with tailored black trousers for a polished evening look.',
    category: 'Smart Casual',
    color: 'Espresso Brown, Black',
  },
  {
    file: 'item03.jpeg',
    slug: 'midnight-satin-shirt',
    title: 'Midnight Satin Shirt',
    description: 'A sleek black satin shirt with wide-leg black trousers for refined monochrome dressing.',
    category: 'Eveningwear',
    color: 'Black',
  },
  {
    file: 'item04.jpeg',
    slug: 'chestnut-coastal-jacket',
    title: 'Chestnut Coastal Jacket',
    description: 'A chestnut bomber jacket layered over a white tee and relaxed ivory trousers.',
    category: 'Outerwear',
    color: 'Chestnut Brown, White, Ivory',
  },
  {
    file: 'item05.jpeg',
    slug: 'cocoa-suede-jacket',
    title: 'Cocoa Suede Jacket',
    description: 'A cocoa suede jacket with a neutral tee and light-wash relaxed denim.',
    category: 'Outerwear',
    color: 'Cocoa Brown, Light Blue',
  },
  {
    file: 'item06.jpeg',
    slug: 'stone-overshirt-set',
    title: 'Stone Overshirt Set',
    description: 'A lightweight stone overshirt layered over a cream tee with straight dark denim.',
    category: 'Casualwear',
    color: 'Stone, Cream, Indigo',
  },
  {
    file: 'item07.jpeg',
    slug: 'sage-knit-polo',
    title: 'Sage Knit Polo',
    description: 'A textured sage knit polo balanced with tailored beige trousers.',
    category: 'Smart Casual',
    color: 'Sage Green, Beige',
  },
  {
    file: 'item08.jpeg',
    slug: 'charcoal-pleated-shirt',
    title: 'Charcoal Pleated Shirt',
    description: 'A charcoal shirt paired with fluid taupe pleated trousers for modern tailoring.',
    category: 'Smart Casual',
    color: 'Charcoal, Taupe',
  },
  {
    file: 'item09.jpeg',
    slug: 'sage-linen-shirt',
    title: 'Sage Linen Shirt',
    description: 'A breathable sage linen shirt styled with deep olive tailored trousers.',
    category: 'Smart Casual',
    color: 'Sage Green, Deep Olive',
  },
  {
    file: 'item10.jpeg',
    slug: 'deep-navy-relaxed-shirt',
    title: 'Deep Navy Relaxed Shirt',
    description: 'A deep navy shirt with relaxed black trousers for an effortless tonal look.',
    category: 'Smart Casual',
    color: 'Deep Navy, Black',
  },
  {
    file: 'item11.jpeg',
    slug: 'ice-blue-embroidered-bandhgala',
    title: 'Ice Blue Embroidered Bandhgala',
    description: 'An intricately embroidered ice blue bandhgala layered over an ivory kurta and tailored trousers.',
    category: 'Ethnicwear',
    color: 'Ice Blue, Ivory',
  },
  {
    file: 'item12.jpeg',
    slug: 'midnight-floral-bandhgala',
    title: 'Midnight Floral Bandhgala',
    description: 'A black bandhgala detailed with delicate floral embroidery and paired with fluid black trousers.',
    category: 'Ethnicwear',
    color: 'Black, Antique Gold, Dusty Pink',
  },
];

function requireEnv(name) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}

async function uploadProductImage(item) {
  const filePath = path.join(sourceRoot, item.file);
  if (!fs.existsSync(filePath)) throw new Error(`Missing collection image: ${filePath}`);

  return cloudinary.uploader.upload(filePath, {
    folder: 'aivestire/products/mens/updated-collection',
    public_id: item.slug,
    overwrite: true,
    invalidate: true,
    resource_type: 'image',
    tags: ['aivestire', 'product', 'menswear', 'updated-collection'],
    context: {
      product_name: item.title,
      audience: 'mens',
      source: 'male_updated_collection',
    },
  });
}

async function main() {
  ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].forEach(requireEnv);
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const creator =
    (await prisma.creator.findFirst({
      where: { store_slug: 'aivestire-mens-collection' },
    })) ||
    (await prisma.creator.findFirst({
      where: { store_slug: 'aivestire-collection' },
    }));
  if (!creator) throw new Error('Aivestire collection creator was not found');

  const uploads = [];
  for (const item of PRODUCTS) {
    console.log(`Uploading ${item.title}...`);
    const upload = await uploadProductImage(item);
    uploads.push({ item, imageUrl: upload.secure_url });
  }

  const activeSlugs = [...PROTECTED_SLUGS, ...PRODUCTS.map(({ slug }) => slug)];
  const results = await prisma.$transaction(async (tx) => {
    const synced = [];
    for (const { item, imageUrl } of uploads) {
      const data = {
        creator_id: creator.creator_id,
        title: item.title,
        description: item.description,
        category: item.category,
        price_cents: 269900,
        commission_percentage: 10,
        currency: 'INR',
        inventory_count: 30,
        status: 'APPROVED',
        is_featured: true,
        is_deleted: false,
        occasions: ['Casual', 'Smart Casual', 'Weekend'],
        body_shapes: ['RECTANGLE', 'ATHLETIC', 'INVERTED_TRIANGLE'],
        skin_tones: ['FAIR', 'LIGHT', 'MEDIUM', 'TAN', 'BROWN', 'DEEP'],
        sizes: ['S', 'M', 'L', 'XL'],
        metadata: {
          audience: 'mens',
          gender: 'male',
          department: 'menswear',
          section: 'mens',
          collection: 'Men’s Collection',
          style: ['Modern', 'Minimal', 'Relaxed'],
          fit: ['Relaxed Fit'],
          fabric: ['Cotton Blend'],
          color: item.color,
          size: 'S, M, L, XL',
          cloudinary_folder: 'aivestire/products/mens/updated-collection',
          seeded_by: 'sync-updated-mens-collection.js',
        },
      };
      const product = await tx.product.upsert({
        where: { slug: item.slug },
        update: data,
        create: { ...data, slug: item.slug },
      });
      await tx.productImage.deleteMany({ where: { product_id: product.product_id } });
      await tx.productImage.create({
        data: {
          product_id: product.product_id,
          url: imageUrl,
          order_index: 0,
          is_primary: true,
        },
      });
      await tx.productStat.upsert({
        where: { product_id: product.product_id },
        update: {},
        create: { product_id: product.product_id, views: 0, likes_count: 0, comments_count: 0 },
      });
      synced.push({ slug: item.slug, title: item.title, image: imageUrl });
    }

    const oldProducts = await tx.product.findMany({
      where: {
        is_deleted: false,
        slug: { notIn: activeSlugs },
        OR: [
          { metadata: { path: ['gender'], equals: 'male' } },
          { metadata: { path: ['audience'], equals: 'mens' } },
          { metadata: { path: ['section'], equals: 'mens' } },
        ],
      },
      select: { product_id: true, slug: true, title: true },
    });
    if (oldProducts.length) {
      await tx.product.updateMany({
        where: { product_id: { in: oldProducts.map(({ product_id }) => product_id) } },
        data: { is_deleted: true, is_featured: false, status: 'ARCHIVED' },
      });
    }
    return { synced, archived: oldProducts };
  });

  console.log(JSON.stringify({
    kept: PROTECTED_SLUGS,
    synced: results.synced,
    archived: results.archived,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
