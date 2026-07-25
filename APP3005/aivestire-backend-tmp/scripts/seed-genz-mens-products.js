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

const PRODUCTS = [
  {
    slug: 'genz-earth-tone-camo-street-set',
    title: 'Earth-Tone Camo Street Set',
    description: 'A relaxed brown overshirt paired with camouflage cargos and a crossbody bag for an easy utility-led streetwear look.',
    category: 'Streetwear', price_cents: 289900, inventory_count: 34,
    image: 'https://images.pexels.com/photos/36192783/pexels-photo-36192783.png?auto=compress&cs=tinysrgb&w=1400',
    source_page: 'https://www.pexels.com/photo/young-man-in-streetwear-exploring-outdoors-36192783/', photographer: 'Joint X',
    style: ['Gen Z', 'Streetwear', 'Utility'], fit: ['Relaxed Fit'], fabric: ['Cotton Blend'], color: 'Brown, Olive, Camo',
    occasions: ['Casual luxury', 'Casual', 'College', 'Travel'], body_shapes: ['RECTANGLE', 'ATHLETIC'], sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    slug: 'genz-black-cargo-studio-fit',
    title: 'Midnight Cargo Studio Fit',
    description: 'A bold monochrome jacket and cargo-pant combination designed for statement evenings and contemporary street styling.',
    category: 'Streetwear', price_cents: 329900, inventory_count: 28,
    image: 'https://images.pexels.com/photos/15883360/pexels-photo-15883360.jpeg?auto=compress&cs=tinysrgb&w=1400',
    source_page: 'https://www.pexels.com/photo/young-man-in-a-trendy-outfit-posing-in-studio-15883360/', photographer: 'Jacob Sierra',
    style: ['Gen Z', 'Streetwear', 'Monochrome'], fit: ['Oversized'], fabric: ['Cotton Blend'], color: 'Black',
    occasions: ['Party', 'Casual luxury', 'Concert', 'Casual'], body_shapes: ['RECTANGLE', 'ATHLETIC', 'INVERTED_TRIANGLE'], sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    slug: 'genz-urban-shorts-layered-look',
    title: 'Urban Layered Shorts Look',
    description: 'A breathable layered top, relaxed shorts, and sneakers combination built for warm-weather city days.',
    category: 'Casualwear', price_cents: 239900, inventory_count: 41,
    image: 'https://images.pexels.com/photos/34802381/pexels-photo-34802381.jpeg?auto=compress&cs=tinysrgb&w=1400',
    source_page: 'https://www.pexels.com/photo/young-man-in-urban-streetwear-fashion-in-morocco-34802381/', photographer: 'Soufian Lafnesh',
    style: ['Gen Z', 'Urban', 'Layered'], fit: ['Relaxed Fit'], fabric: ['Cotton'], color: 'Neutral, Black',
    occasions: ['Casual luxury', 'Resort', 'Casual', 'College', 'Weekend'], body_shapes: ['RECTANGLE', 'ATHLETIC'], sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    slug: 'genz-white-tee-beige-cargos',
    title: 'White Tee & Beige Cargo Set',
    description: 'A clean white tee balanced with loose beige cargo sweatpants for a minimal, versatile Gen Z uniform.',
    category: 'Casualwear', price_cents: 219900, inventory_count: 47,
    image: 'https://images.pexels.com/photos/18393526/pexels-photo-18393526.jpeg?auto=compress&cs=tinysrgb&w=1400',
    source_page: 'https://www.pexels.com/photo/young-man-posing-in-white-t-shirt-and-beige-cargo-sweatpants-18393526/', photographer: 'Wolrider YURTSEVEN',
    style: ['Gen Z', 'Minimal', 'Streetwear'], fit: ['Relaxed Fit'], fabric: ['Cotton'], color: 'White, Beige',
    occasions: ['Casual luxury', 'Casual', 'College', 'Travel'], body_shapes: ['RECTANGLE', 'ATHLETIC', 'INVERTED_TRIANGLE'], sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    slug: 'genz-neutral-knit-denim-fit',
    title: 'Neutral Knit & Light Denim Fit',
    description: 'A soft neutral knit with relaxed light-wash denim and sneakers for an understated everyday street look.',
    category: 'Casualwear', price_cents: 269900, inventory_count: 38,
    image: 'https://images.pexels.com/photos/36510852/pexels-photo-36510852.jpeg?auto=compress&cs=tinysrgb&w=1400',
    source_page: 'https://www.pexels.com/photo/fashionable-young-man-in-casual-streetwear-36510852/', photographer: 'Mert Coşkun',
    style: ['Gen Z', 'Minimal', 'Everyday'], fit: ['Relaxed Fit'], fabric: ['Cotton Knit', 'Denim'], color: 'Beige, Green, Light Blue',
    occasions: ['Casual luxury', 'Casual', 'College', 'Weekend'], body_shapes: ['RECTANGLE', 'ATHLETIC'], sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    slug: 'genz-black-tank-baggy-denim',
    title: 'Black Tank & Baggy Denim Look',
    description: 'A sharp black tank teamed with baggy blue denim and white sneakers for a clean hip-hop-inspired silhouette.',
    category: 'Streetwear', price_cents: 249900, inventory_count: 31,
    image: 'https://images.pexels.com/photos/30599804/pexels-photo-30599804.jpeg?auto=compress&cs=tinysrgb&w=1400',
    source_page: 'https://www.pexels.com/photo/young-man-in-urban-streetwear-by-empty-booth-30599804/', photographer: 'Mustapha Damilola',
    style: ['Gen Z', 'Hip Hop', 'Streetwear'], fit: ['Baggy Fit'], fabric: ['Cotton', 'Denim'], color: 'Black, Blue',
    occasions: ['Casual luxury', 'Party', 'Casual', 'Concert', 'Weekend'], body_shapes: ['RECTANGLE', 'ATHLETIC', 'INVERTED_TRIANGLE'], sizes: ['S', 'M', 'L', 'XL'],
  },
];

function requireEnv(name) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}

async function getCreator() {
  const creator = await prisma.creator.findFirst({ where: { store_slug: 'aivestire-mens-collection' } });
  if (!creator) throw new Error('Run seed-mens-image-product.js first to create the mens collection creator');
  return creator;
}

async function seedProduct(creator, item) {
  const upload = await cloudinary.uploader.upload(item.image, {
    folder: 'aivestire/products/mens/gen-z', public_id: item.slug, overwrite: true,
    resource_type: 'image', tags: ['aivestire', 'product', 'menswear', 'gen-z', 'pexels'],
    context: { source: item.source_page, photographer: item.photographer, audience: 'mens' },
  });

  const data = {
    creator_id: creator.creator_id, title: item.title, description: item.description,
    category: item.category, price_cents: item.price_cents, commission_percentage: 10,
    currency: 'INR', inventory_count: item.inventory_count, status: 'APPROVED',
    is_featured: true, is_deleted: false, occasions: item.occasions,
    body_shapes: item.body_shapes, skin_tones: ['FAIR', 'LIGHT', 'MEDIUM', 'TAN', 'BROWN', 'DEEP'], sizes: item.sizes,
    metadata: {
      audience: 'mens', gender: 'male', department: 'menswear', section: 'mens', collection: 'Gen Z Mens Edit',
      age_group: '18-25', style: item.style, fit: item.fit, fabric: item.fabric, color: item.color,
      size: item.sizes.join(', '), image_source: item.source_page, photographer: item.photographer,
      license_source: 'Pexels - Free to use', seeded_by: 'seed-genz-mens-products.js',
    },
  };

  const existing = await prisma.product.findUnique({ where: { slug: item.slug }, select: { product_id: true } });
  const product = existing
    ? await prisma.product.update({ where: { product_id: existing.product_id }, data })
    : await prisma.product.create({ data: { ...data, slug: item.slug } });

  await prisma.productImage.deleteMany({ where: { product_id: product.product_id } });
  await prisma.productImage.create({ data: { product_id: product.product_id, url: upload.secure_url, order_index: 0, is_primary: true } });
  await prisma.productStat.upsert({
    where: { product_id: product.product_id }, update: {},
    create: { product_id: product.product_id, views: 0, likes_count: 0, comments_count: 0 },
  });
  return { id: product.product_id, title: item.title, image: upload.secure_url };
}

async function main() {
  ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].forEach(requireEnv);
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  const creator = await getCreator();
  const results = [];
  for (const item of PRODUCTS) {
    console.log(`Seeding ${item.title}...`);
    results.push(await seedProduct(creator, item));
  }
  console.log(JSON.stringify({ seeded: results.length, products: results }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
