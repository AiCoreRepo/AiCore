/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_COLLECTION_PATH = '/app/seed/main_train_data.csv';
const DEFAULT_LIMIT = 200;
const CLOUDINARY_TRYON_ROOT =
  'https://res.cloudinary.com/dxfxicebq/image/upload/aivestire/tryon';
const GUEST_DEMO_COLLECTIONS = [
  {
    gender: 'female',
    folder: 'guest-demo-v2',
    model: 'model',
    looks: [
      {
        id: 'item1',
        slug: 'guest-tryon-new-item-1',
        title: 'Ivory Threadwork Kurta',
        subtitle: 'Ivory kurta with relaxed cocoa trousers',
      },
      {
        id: 'item2',
        slug: 'guest-tryon-new-item-2',
        title: 'Olive Breeze Shirt Set',
        subtitle: 'Flowing olive shirt with soft ivory trousers',
      },
      {
        id: 'item3',
        slug: 'guest-tryon-new-item-3',
        title: 'Teal Woven Saree',
        subtitle: 'Elegant teal drape with a woven border',
      },
    ],
  },
  {
    gender: 'male',
    folder: 'guest-demo-male',
    model: 'model',
    looks: [
      {
        id: 'male1',
        slug: 'male-collection-look-1',
        title: 'Sky Blue Relaxed Shirt',
        subtitle: 'Light blue shirt with charcoal wide leg trousers',
      },
      {
        id: 'male2',
        slug: 'male-collection-look-2',
        title: 'Midnight Tee Set',
        subtitle: 'Black tee styled with relaxed ivory trousers',
      },
      {
        id: 'male3',
        slug: 'male-collection-look-3',
        title: 'Mehendi Green Kurta',
        subtitle: 'Textured green kurta paired with ivory trousers',
      },
    ],
  },
];

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

const hasExtendedCatalogFields = (row) =>
  Boolean(
    row.cloth_id ||
      row.audience ||
      row.gender ||
      row.title ||
      row.price_cents,
  );

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
    age_group: row['@Age Group'] || undefined,
    audience: row.audience || undefined,
    gender: row.gender || undefined,
    department: row.audience === 'mens' ? 'menswear' : row.audience === 'womens' ? 'womenswear' : undefined,
    section: row.audience || undefined,
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

const syncGuestDemoProducts = async (creator) => {
  let synced = 0;
  for (const collection of GUEST_DEMO_COLLECTIONS) {
    const audience = collection.gender === 'male' ? 'mens' : 'womens';
    const modelUrl = `${CLOUDINARY_TRYON_ROOT}/${collection.folder}/${collection.model}`;
    for (const look of collection.looks) {
      const collectionImage = `${CLOUDINARY_TRYON_ROOT}/${collection.folder}/${look.id}-collection`;
      const staticResultImage = `${CLOUDINARY_TRYON_ROOT}/${collection.folder}/${look.id}-result`;
      const data = {
        creator_id: creator.creator_id,
        title: look.title,
        description: look.subtitle,
        category: collection.gender === 'male' ? 'Menswear' : 'Womenswear',
        price_cents: 289900,
        currency: 'INR',
        inventory_count: 25,
        status: 'APPROVED',
        is_featured: true,
        is_deleted: false,
        metadata: {
          audience,
          gender: collection.gender,
          department: collection.gender === 'male' ? 'menswear' : 'womenswear',
          section: audience,
          guest_tryon_demo: true,
          guest_tryon_gender: collection.gender,
          demo_look_id: look.id,
          static_model_url: modelUrl,
          static_tryon_url: staticResultImage,
          generated_by: 'DirectGeminiTryOnService',
        },
      };
      const product = await prisma.product.upsert({
        where: { slug: look.slug },
        update: data,
        create: { ...data, slug: look.slug },
      });
      const image = await prisma.productImage.findFirst({
        where: { product_id: product.product_id },
        orderBy: [{ is_primary: 'desc' }, { order_index: 'asc' }],
      });
      if (image) {
        await prisma.productImage.update({
          where: { image_id: image.image_id },
          data: {
            url: collectionImage,
            order_index: 0,
            is_primary: true,
          },
        });
      } else {
        await prisma.productImage.create({
          data: {
            product_id: product.product_id,
            url: collectionImage,
            order_index: 0,
            is_primary: true,
          },
        });
      }
      synced += 1;
    }
  }
  console.log(`Guest demo sync complete. Synced ${synced} products.`);
};

const seedProducts = async () => {
  const skip = String(process.env.SEED_SKIP || '').toLowerCase() === 'true';
  if (skip) {
    console.log('Seed skipped (SEED_SKIP=true).');
    return;
  }

  const filePath = process.env.SEED_COLLECTION_PATH || DEFAULT_COLLECTION_PATH;
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.warn(`Seed file not found: ${resolved}`);
    return;
  }

  const csv = fs.readFileSync(resolved, 'utf-8');
  // The collection contains legacy rows with the original 16 columns and newer
  // rows with additional catalogue fields. Missing trailing fields are valid and
  // should be exposed as undefined instead of preventing a fresh database boot.
  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count_less: true,
  });
  const limit = toInt(process.env.SEED_LIMIT, DEFAULT_LIMIT);
  const extendedRecords = records.filter(hasExtendedCatalogFields);
  const existing = await prisma.product.count();
  const force = String(process.env.SEED_FORCE || '').toLowerCase() === 'true';
  let items;

  if (existing > 0 && !force) {
    // Keep startup idempotent while still syncing catalogue rows appended after
    // the legacy seed limit (for example the men's collection).
    items = extendedRecords;
    console.log(
      `Seed base skipped (already ${existing} products); syncing ${items.length} extended catalogue products.`,
    );
  } else {
    const baseItems = limit > 0 ? records.slice(0, limit) : records;
    items = [
      ...baseItems,
      ...extendedRecords.filter((row) => !baseItems.includes(row)),
    ];
  }

  const creator = await ensureCreator();
  let created = 0;
  let updated = 0;

  for (let i = 0; i < items.length; i += 1) {
    const row = items[i];
    const imageUrl = row.image_url || row['image_url'];
    if (!imageUrl) {
      continue;
    }

    const extended = hasExtendedCatalogFields(row);
    const rawTitle =
      row.title ||
      row['Clothing Type'] ||
      row['Style'] ||
      row['Description'] ||
      'Collection Item';
    const title = titleCase(rawTitle);
    const slugBase = extended
      ? slugify(row.Image || row.cloth_id || title) || `catalogue-item-${i + 1}`
      : slugify(`${title}-${i + 1}`) || `item-${i + 1}`;
    const description = row['Description'] || row['Prompt'] || '';
    const category = titleCase(row['Clothing Type'] || row['Style'] || 'Collection');
    const metadata = buildMetadata(row);
    const productData = {
      title,
      description,
      price_cents: toInt(row.price_cents, computePriceCents(row['Score'], i)),
      currency: 'INR',
      inventory_count: 25,
      status: 'APPROVED',
      category,
      metadata,
      occasions: metadata.occasions,
      body_shapes: metadata.body_shapes,
      skin_tones: metadata.skin_tones,
      sizes: metadata.sizes,
    };

    try {
      if (extended) {
        const existingProduct = await prisma.product.findUnique({
          where: { slug: slugBase },
          select: { product_id: true },
        });

        if (existingProduct) {
          await prisma.product.update({
            where: { product_id: existingProduct.product_id },
            data: productData,
          });
          const existingImage = await prisma.productImage.findFirst({
            where: { product_id: existingProduct.product_id },
            orderBy: [{ is_primary: 'desc' }, { order_index: 'asc' }],
            select: { image_id: true },
          });
          if (existingImage) {
            await prisma.productImage.update({
              where: { image_id: existingImage.image_id },
              data: { url: imageUrl, is_primary: true, order_index: 0 },
            });
          } else {
            await prisma.productImage.create({
              data: {
                product_id: existingProduct.product_id,
                url: imageUrl,
                order_index: 0,
                is_primary: true,
              },
            });
          }
          updated += 1;
          continue;
        }
      }

      await prisma.product.create({
        data: {
          slug: slugBase,
          ...productData,
          creator: { connect: { creator_id: creator.creator_id } },
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

  await syncGuestDemoProducts(creator);
  console.log(`Seed complete. Created ${created} products and updated ${updated} products.`);
};

seedProducts()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
