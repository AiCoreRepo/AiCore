/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEMO_EMAILS = [
  'pulkitgupta6677@gmail.com',
  'rushabhbelani2212@gmail.com',
];
const AVATAR_URL =
  'https://res.cloudinary.com/dxfxicebq/image/upload/f_auto,q_100,w_924,e_sharpen:70/v1785082730/aivestire/demo/pulkit/pulkit-avatar';
const PRODUCT_IMAGE_ROOT =
  'https://res.cloudinary.com/dxfxicebq/image/upload/f_auto,q_auto:good,w_1200/aivestire/products/mens/updated-collection';
const ATTRIBUTES = {
  height_cm: 187,
  weight_kg: 74,
  skin_tone: 'LIGHT',
  gender: 'male',
  body_shape: 'RECTANGLE',
  body_type: 'AVERAGE',
  body_size: 'M',
  age_range: '26-35',
  hair_style: 'SHORT_WAVY',
  beard: true,
};
const FIXED_TRY_ON_SLUGS = [
  'male-collection-look-2',
  'male-collection-look-3',
  'male-collection-look-1',
  'ice-blue-embroidered-bandhgala',
  'midnight-floral-bandhgala',
];
const FIXED_TRY_ON_VERSIONS = [
  '1785064774', '1785064779', '1785064785', '1785064795', '1785064808',
];
const FIXED_ANGLE_VERSIONS = [
  '1785064777', '1785064782', '1785064789', '1785064801', '1785064818',
];
const UPDATED_PRODUCTS = [
  ['chocolate-brown-relaxed-shirt', 'Chocolate Brown Relaxed Shirt', 'A chocolate brown open-collar shirt styled with relaxed ivory trousers.', 'Casualwear', 'Chocolate Brown, Ivory'],
  ['espresso-evening-shirt', 'Espresso Evening Shirt', 'A rich espresso shirt paired with tailored black trousers for a polished evening look.', 'Smart Casual', 'Espresso Brown, Black'],
  ['midnight-satin-shirt', 'Midnight Satin Shirt', 'A sleek black satin shirt with wide-leg black trousers for refined monochrome dressing.', 'Eveningwear', 'Black'],
  ['chestnut-coastal-jacket', 'Chestnut Coastal Jacket', 'A chestnut bomber jacket layered over a white tee and relaxed ivory trousers.', 'Outerwear', 'Chestnut Brown, White, Ivory'],
  ['cocoa-suede-jacket', 'Cocoa Suede Jacket', 'A cocoa suede jacket with a neutral tee and light-wash relaxed denim.', 'Outerwear', 'Cocoa Brown, Light Blue'],
  ['stone-overshirt-set', 'Stone Overshirt Set', 'A lightweight stone overshirt layered over a cream tee with straight dark denim.', 'Casualwear', 'Stone, Cream, Indigo'],
  ['sage-knit-polo', 'Sage Knit Polo', 'A textured sage knit polo balanced with tailored beige trousers.', 'Smart Casual', 'Sage Green, Beige'],
  ['charcoal-pleated-shirt', 'Charcoal Pleated Shirt', 'A charcoal shirt paired with fluid taupe pleated trousers for modern tailoring.', 'Smart Casual', 'Charcoal, Taupe'],
  ['sage-linen-shirt', 'Sage Linen Shirt', 'A breathable sage linen shirt styled with deep olive tailored trousers.', 'Smart Casual', 'Sage Green, Deep Olive'],
  ['deep-navy-relaxed-shirt', 'Deep Navy Relaxed Shirt', 'A deep navy shirt with relaxed black trousers for an effortless tonal look.', 'Smart Casual', 'Deep Navy, Black'],
  ['ice-blue-embroidered-bandhgala', 'Ice Blue Embroidered Bandhgala', 'An intricately embroidered ice blue bandhgala layered over an ivory kurta and tailored trousers.', 'Ethnicwear', 'Ice Blue, Ivory'],
  ['midnight-floral-bandhgala', 'Midnight Floral Bandhgala', 'A black bandhgala detailed with delicate floral embroidery and paired with fluid black trousers.', 'Ethnicwear', 'Black, Antique Gold, Dusty Pink'],
];
const PROTECTED_SLUGS = [
  'male-collection-look-1',
  'male-collection-look-2',
  'male-collection-look-3',
];

const tryOnUrl = (slug) => {
  const index = FIXED_TRY_ON_SLUGS.indexOf(slug);
  return index < 0
    ? null
    : `https://res.cloudinary.com/dxfxicebq/image/upload/f_auto,q_100,w_1024,e_sharpen:100/v${FIXED_TRY_ON_VERSIONS[index]}/aivestire/demo/pulkit/tryon-${index + 1}-${slug}`;
};

const angleUrl = (slug) => {
  const index = FIXED_TRY_ON_SLUGS.indexOf(slug);
  return index < 0
    ? null
    : `https://res.cloudinary.com/dxfxicebq/image/upload/f_auto,q_100,w_1024,e_sharpen:100/v${FIXED_ANGLE_VERSIONS[index]}/aivestire/demo/pulkit/tryon-${index + 1}-angle-${slug}`;
};

async function syncMensCollection(creator) {
  for (const [slug, title, description, category, color] of UPDATED_PRODUCTS) {
    const fixedResult = tryOnUrl(slug);
    const data = {
      creator_id: creator.creator_id,
      title,
      description,
      category,
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
        color,
        size: 'S, M, L, XL',
        cloudinary_folder: 'aivestire/products/mens/updated-collection',
        pulkit_demo_priority: fixedResult
          ? FIXED_TRY_ON_SLUGS.indexOf(slug) + 1
          : undefined,
        pulkit_demo_tryon_url: fixedResult || undefined,
        seeded_by: 'seed-static-mens-demo.js',
      },
    };
    const product = await prisma.product.upsert({
      where: { slug },
      update: data,
      create: { slug, ...data },
    });
    const imageUrl = `${PRODUCT_IMAGE_ROOT}/${slug}`;
    const image = await prisma.productImage.findFirst({
      where: { product_id: product.product_id },
      orderBy: [{ is_primary: 'desc' }, { order_index: 'asc' }],
    });
    if (image) {
      await prisma.productImage.update({
        where: { image_id: image.image_id },
        data: { url: imageUrl, is_primary: true, order_index: 0 },
      });
    } else {
      await prisma.productImage.create({
        data: { product_id: product.product_id, url: imageUrl, is_primary: true, order_index: 0 },
      });
    }
  }

  const activeSlugs = [...PROTECTED_SLUGS, ...UPDATED_PRODUCTS.map(([slug]) => slug)];
  await prisma.product.updateMany({
    where: {
      is_deleted: false,
      slug: { notIn: activeSlugs },
      OR: [
        { metadata: { path: ['gender'], equals: 'male' } },
        { metadata: { path: ['audience'], equals: 'mens' } },
        { metadata: { path: ['section'], equals: 'mens' } },
      ],
    },
    data: { is_deleted: true, is_featured: false, status: 'ARCHIVED' },
  });
}

async function seedDemoAccount(email, products) {
  const now = new Date().toISOString();
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'BUYER',
      status: 'active',
      try_on_permission: 'APPROVED',
      max_try_ons: 10,
    },
    create: {
      email,
      role: 'BUYER',
      status: 'active',
      try_on_permission: 'APPROVED',
      max_try_ons: 10,
      try_ons_used: 0,
      has_created_aura: false,
      max_avatar_regenerations: -1,
    },
  });
  const avatar = {
    avatar_id: 'mens-static-demo-avatar-v1',
    model_url: AVATAR_URL,
    tryon_model_url: AVATAR_URL,
    source: 'creation',
    generation_type: 'original',
    created_at: now,
    attributes: ATTRIBUTES,
  };
  const auraData = {
    image_url: AVATAR_URL,
    model_url: AVATAR_URL,
    tryon_model_url: AVATAR_URL,
    generated_avatar_urls: [AVATAR_URL],
    ...ATTRIBUTES,
    status: 'READY',
    extra_attributes: { static_demo: true, demo_email: email },
    attributes: {
      type: 'original',
      processedAt: now,
      selected_avatar_id: avatar.avatar_id,
      avatar_history: [avatar],
      attributes: ATTRIBUTES,
    },
  };
  const aura = await prisma.aura.upsert({
    where: { user_id: user.user_id },
    update: auraData,
    create: { user_id: user.user_id, ...auraData },
  });

  for (const product of products) {
    const resultImageUrl = tryOnUrl(product.slug);
    const existing = await prisma.tryOn.findFirst({
      where: {
        user_id: user.user_id,
        aura_id: aura.aura_id,
        product_id: product.product_id,
        angle: null,
        base_tryon_id: null,
      },
    });
    const data = {
      result_image_url: resultImageUrl,
      provider: 'static-demo',
      processing_metrics: {
        staticDemo: true,
        selectedAvatarId: avatar.avatar_id,
        selectedAvatarModelUrl: AVATAR_URL,
        selectedAvatarTryOnModelUrl: AVATAR_URL,
        processingTimeMs: 0,
      },
    };
    if (existing) {
      await prisma.tryOn.update({ where: { try_on_id: existing.try_on_id }, data });
    } else {
      await prisma.tryOn.create({
        data: {
          user_id: user.user_id,
          aura_id: aura.aura_id,
          product_id: product.product_id,
          ...data,
        },
      });
    }
    const base = existing || await prisma.tryOn.findFirst({
      where: {
        user_id: user.user_id,
        aura_id: aura.aura_id,
        product_id: product.product_id,
        angle: null,
        base_tryon_id: null,
      },
    });
    const existingAngle = await prisma.tryOn.findFirst({
      where: {
        user_id: user.user_id,
        aura_id: aura.aura_id,
        product_id: product.product_id,
        angle: 'three-quarter',
      },
    });
    const angleData = {
      result_image_url: angleUrl(product.slug),
      provider: 'static-demo',
      angle: 'three-quarter',
      base_tryon_id: base.try_on_id,
      processing_metrics: { ...data.processing_metrics, angle: 'three-quarter' },
    };
    if (existingAngle) {
      await prisma.tryOn.update({ where: { try_on_id: existingAngle.try_on_id }, data: angleData });
    } else {
      await prisma.tryOn.create({
        data: {
          user_id: user.user_id,
          aura_id: aura.aura_id,
          product_id: product.product_id,
          ...angleData,
        },
      });
    }
  }
}

async function main() {
  const creator = await prisma.creator.findFirst({
    where: { store_slug: 'aivestire-collection' },
  });
  if (!creator) throw new Error('Base product seed creator is missing');

  await syncMensCollection(creator);
  const products = await prisma.product.findMany({
    where: { slug: { in: FIXED_TRY_ON_SLUGS }, is_deleted: false },
    select: { product_id: true, slug: true },
  });
  if (products.length !== FIXED_TRY_ON_SLUGS.length) {
    throw new Error(
      `Static demo requires ${FIXED_TRY_ON_SLUGS.length} products; found ${products.length}`,
    );
  }
  for (const email of DEMO_EMAILS) {
    await seedDemoAccount(email, products);
  }
  console.log(
    `Static men's demo seed complete: ${UPDATED_PRODUCTS.length + PROTECTED_SLUGS.length} products, ${DEMO_EMAILS.length} accounts, ${products.length * DEMO_EMAILS.length} base try-ons and ${products.length * DEMO_EMAILS.length} alternate angles.`,
  );
}

main()
  .catch((error) => {
    console.error('Static men demo seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
