/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_COLLECTION_PATH = '/app/seed/main_train_data.csv';
const DEFAULT_LIMIT = 200;

const toInt = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const slugify = (input) =>
  String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

const titleCase = (value) =>
  String(value || '')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const splitList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const computePriceCents = (score, index) => {
  const base = 1200;
  const multiplier = 3800;
  const scoreValue = Math.min(1, Math.max(0, Number(score || 0.5)));
  const price = Math.round((base + scoreValue * multiplier + (index % 17) * 75) * 100);
  return price;
};

const buildMetadata = (row) => {
  const occasions = splitList(row['@Occasion']);
  const bodyShapes = splitList(row['@Recommended Body shape']);
  const sizes = splitList(row['@Recommended size']);
  const skinTones = splitList(row['@Skin tone']);

  return {
    occasions,
    body_shapes: bodyShapes,
    skin_tones: skinTones,
    sizes,
    size: sizes.join(', '),
    color: row['Color_family'] || row['Color Family'] || undefined,
    fit: row['Fit'] || undefined,
    fabric: row['Fabric'] || undefined,
    style: row['Style'] || undefined,
    quality_tag: row['Quality_Tag'] || row['Quality Tag'] || undefined,
  };
};

const ensureCreator = async () => {
  const email = process.env.SEED_CREATOR_EMAIL || 'seed@aivestire.local';
  const storeName = process.env.SEED_CREATOR_STORE || 'Aivestire Collection';
  const storeSlug = slugify(storeName) || 'aivestire-collection';

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'CREATOR' },
    create: { email, role: 'CREATOR' },
  });

  const creator = await prisma.creator.upsert({
    where: { user_id: user.user_id },
    update: { store_name: storeName, store_slug: storeSlug, verified: true },
    create: {
      user_id: user.user_id,
      store_name: storeName,
      store_slug: storeSlug,
      verified: true,
      terms_accepted: true,
    },
  });

  return creator;
};

const seedProducts = async () => {
  const skip = String(process.env.SEED_SKIP || '').toLowerCase() === 'true';
  if (skip) {
    console.log('Seed skipped (SEED_SKIP=true).');
    return;
  }

  const existing = await prisma.product.count();
  if (existing > 0 && String(process.env.SEED_FORCE || '').toLowerCase() !== 'true') {
    console.log(`Seed skipped (already ${existing} products).`);
    return;
  }

  const filePath = process.env.SEED_COLLECTION_PATH || DEFAULT_COLLECTION_PATH;
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.warn(`Seed file not found: ${resolved}`);
    return;
  }

  const csv = fs.readFileSync(resolved, 'utf-8');
  const records = parse(csv, { columns: true, skip_empty_lines: true });
  const limit = toInt(process.env.SEED_LIMIT, DEFAULT_LIMIT);
  const items = limit > 0 ? records.slice(0, limit) : records;

  const creator = await ensureCreator();
  let created = 0;

  for (let i = 0; i < items.length; i += 1) {
    const row = items[i];
    const imageUrl = row.image_url || row['image_url'];
    if (!imageUrl) {
      continue;
    }

    const rawTitle = row['Clothing Type'] || row['Style'] || row['Description'] || 'Collection Item';
    const title = titleCase(rawTitle);
    const slugBase = slugify(`${title}-${i + 1}`) || `item-${i + 1}`;
    const description = row['Description'] || row['Prompt'] || '';
    const category = titleCase(row['Clothing Type'] || row['Style'] || 'Collection');

    try {
      await prisma.product.create({
        data: {
          title,
          slug: slugBase,
          description,
          price_cents: computePriceCents(row['Score'], i),
          currency: 'INR',
          inventory_count: 25,
          status: 'APPROVED',
          category,
          creator: { connect: { creator_id: creator.creator_id } },
          metadata: buildMetadata(row),
          images: {
            create: [
              {
                url: imageUrl,
                order_index: 0,
                is_primary: true,
              },
            ],
          },
        },
      });
      created += 1;
    } catch (error) {
      console.warn(`Seed row ${i + 1} failed: ${error.message}`);
    }
  }

  console.log(`Seed complete. Created ${created} products.`);
};

seedProducts()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
