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
const ASSET_DIR = path.resolve(__dirname, '..', 'seed', 'tryon-static');
const OLD_REVEALING_SLUGS = [
  'genz-womens-pink-oversized-denim-look',
  'genz-womens-edgy-layered-street-fit',
  'genz-womens-green-cargo-street-look',
  'genz-womens-bucket-hat-denim-fit',
  'genz-womens-monochrome-bucket-hat-set',
  'genz-womens-graphic-top-blue-pants',
];

const LOOKS = [
  {
    id: 'denim', slug: 'genz-womens-modest-denim-layer', title: 'Easy Denim Layers',
    subtitle: 'Longline denim overshirt with relaxed jeans', category: 'Casualwear',
    price_cents: 289900, inventory_count: 42, file: 'result-denim.png',
    style: ['Gen Z', 'Modest', 'Layered'], fit: ['Oversized'], fabric: ['Denim', 'Cotton'], color: 'Powder Blue, Indigo, White',
    occasions: ['Casual luxury', 'College', 'Casual', 'Travel'], sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    id: 'sage', slug: 'genz-womens-modest-sage-utility', title: 'Sage Utility Comfort',
    subtitle: 'Oversized sweatshirt with relaxed cargo trousers', category: 'Streetwear',
    price_cents: 269900, inventory_count: 38, file: 'result-sage.png',
    style: ['Gen Z', 'Modest', 'Utility'], fit: ['Oversized'], fabric: ['Cotton Fleece', 'Cotton Twill'], color: 'Sage, Beige',
    occasions: ['Casual luxury', 'College', 'Casual', 'Weekend'], sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    id: 'navy', slug: 'genz-womens-modest-navy-coord', title: 'Navy Everyday Co-ord',
    subtitle: 'Longline overshirt with wide-leg trousers', category: 'Co-ords',
    price_cents: 319900, inventory_count: 35, file: 'result-navy.png',
    style: ['Gen Z', 'Modest', 'Minimal'], fit: ['Relaxed Fit'], fabric: ['Cotton Blend'], color: 'Navy, Cream',
    occasions: ['Casual luxury', 'Formal', 'College', 'Casual', 'Smart Casual'], sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
];

function requireEnv(name) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}

async function archiveOldRevealingProducts() {
  const products = await prisma.product.findMany({
    where: { slug: { in: OLD_REVEALING_SLUGS } },
    select: { product_id: true, slug: true, images: { select: { url: true } } },
  });
  for (const product of products) {
    for (const image of product.images) {
      const match = image.url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+(?:\?.*)?$/i);
      if (match) await cloudinary.uploader.destroy(match[1]);
    }
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { product_id: product.product_id } }),
      prisma.product.update({ where: { product_id: product.product_id }, data: { is_deleted: true, status: 'ARCHIVED', is_featured: false } }),
    ]);
    console.log(`Archived revealing seed product: ${product.slug}`);
  }
}

async function uploadAsset(file, publicId) {
  const filePath = path.join(ASSET_DIR, file);
  if (!fs.existsSync(filePath)) throw new Error(`Missing generated asset: ${filePath}`);
  return cloudinary.uploader.upload(filePath, {
    folder: 'aivestire/tryon/static-demo', public_id: publicId, overwrite: true,
    resource_type: 'image', tags: ['aivestire', 'tryon', 'static-demo', 'modest'],
  });
}

async function upsertLook(creator, look, imageUrl) {
  const data = {
    creator_id: creator.creator_id, title: look.title,
    description: `${look.subtitle}. A modest Gen Z look designed for comfortable everyday styling.`,
    category: look.category, price_cents: look.price_cents, commission_percentage: 10,
    currency: 'INR', inventory_count: look.inventory_count, status: 'APPROVED',
    is_featured: true, is_deleted: false, occasions: look.occasions,
    body_shapes: ['RECTANGLE', 'PEAR', 'HOURGLASS', 'APPLE'],
    skin_tones: ['FAIR', 'LIGHT', 'MEDIUM', 'TAN', 'BROWN', 'DEEP'], sizes: look.sizes,
    metadata: {
      audience: 'womens', gender: 'female', department: 'womenswear', section: 'womens',
      collection: 'Gen Z Womens Edit', demo_look_id: look.id, modest: true, age_group: '18-25',
      style: look.style, fit: look.fit, fabric: look.fabric, color: look.color,
      size: look.sizes.join(', '), seeded_by: 'seed-home-tryon-demo.js',
    },
  };
  const existing = await prisma.product.findUnique({ where: { slug: look.slug }, select: { product_id: true } });
  const product = existing
    ? await prisma.product.update({ where: { product_id: existing.product_id }, data })
    : await prisma.product.create({ data: { ...data, slug: look.slug } });
  await prisma.productImage.deleteMany({ where: { product_id: product.product_id } });
  await prisma.productImage.create({ data: { product_id: product.product_id, url: imageUrl, order_index: 0, is_primary: true } });
  await prisma.productStat.upsert({
    where: { product_id: product.product_id }, update: {},
    create: { product_id: product.product_id, views: 0, likes_count: 0, comments_count: 0 },
  });
  return { ...look, productId: product.product_id, imageUrl };
}

async function main() {
  ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].forEach(requireEnv);
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
  const creator = await prisma.creator.findFirst({ where: { store_slug: 'aivestire-collection' } });
  if (!creator) throw new Error('Aivestire collection creator was not found');

  await archiveOldRevealingProducts();
  const modelUpload = await uploadAsset('model.png', 'model');
  const results = [];
  for (const look of LOOKS) {
    const upload = await uploadAsset(look.file, `result-${look.id}`);
    results.push(await upsertLook(creator, look, upload.secure_url));
  }
  console.log(JSON.stringify({ modelImage: modelUpload.secure_url, looks: results }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
