/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const toInt = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const TEST_CREATOR_EMAIL =
  process.env.TEST_PRODUCT_CREATOR_EMAIL || 'payu-test-product@aivestire.local';
const TEST_CREATOR_STORE_NAME =
  process.env.TEST_PRODUCT_CREATOR_STORE_NAME || 'Aivestire Payment Test Store';
const TEST_CREATOR_STORE_SLUG =
  process.env.TEST_PRODUCT_CREATOR_STORE_SLUG || 'aivestire-payment-test-store';
const TEST_PRODUCT_TITLE =
  process.env.TEST_PRODUCT_TITLE || 'Aivestire Payment Test Product';
const TEST_PRODUCT_SLUG =
  process.env.TEST_PRODUCT_SLUG || 'aivestire-payment-test-product-1-rupee';
const TEST_PRODUCT_DESCRIPTION =
  process.env.TEST_PRODUCT_DESCRIPTION ||
  'Internal payment validation product for checkout testing on dev and production.';
const TEST_PRODUCT_IMAGE_URL =
  process.env.TEST_PRODUCT_IMAGE_URL || '/images/product-1.png';
const TEST_PRODUCT_CATEGORY =
  process.env.TEST_PRODUCT_CATEGORY || 'Testing';
const TEST_PRODUCT_PRICE_CENTS = toInt(
  process.env.TEST_PRODUCT_PRICE_CENTS,
  100,
);
const TEST_PRODUCT_COMMISSION_PERCENTAGE = toInt(
  process.env.TEST_PRODUCT_COMMISSION_PERCENTAGE,
  0,
);
const TEST_PRODUCT_INVENTORY = toInt(process.env.TEST_PRODUCT_INVENTORY, 100);

async function ensureCreator() {
  const user = await prisma.user.upsert({
    where: { email: TEST_CREATOR_EMAIL },
    update: {
      role: 'CREATOR',
      status: 'active',
      phone_verified: true,
    },
    create: {
      email: TEST_CREATOR_EMAIL,
      role: 'CREATOR',
      status: 'active',
      phone_verified: true,
    },
  });

  const creator = await prisma.creator.upsert({
    where: { user_id: user.user_id },
    update: {
      store_name: TEST_CREATOR_STORE_NAME,
      store_slug: TEST_CREATOR_STORE_SLUG,
      verified: true,
      terms_accepted: true,
      terms_accepted_at: new Date(),
    },
    create: {
      user_id: user.user_id,
      store_name: TEST_CREATOR_STORE_NAME,
      store_slug: TEST_CREATOR_STORE_SLUG,
      verified: true,
      terms_accepted: true,
      terms_accepted_at: new Date(),
      limits: {
        create: {
          max_products: 20,
          max_images_per_product: 5,
        },
      },
    },
  });

  return creator;
}

async function upsertTestProduct() {
  const creator = await ensureCreator();

  const commonData = {
    title: TEST_PRODUCT_TITLE,
    description: TEST_PRODUCT_DESCRIPTION,
    price_cents: TEST_PRODUCT_PRICE_CENTS,
    commission_percentage: TEST_PRODUCT_COMMISSION_PERCENTAGE,
    currency: 'INR',
    inventory_count: TEST_PRODUCT_INVENTORY,
    category: TEST_PRODUCT_CATEGORY,
    status: 'APPROVED',
    is_featured: false,
    is_deleted: false,
    metadata: {
      purpose: 'payment_test',
      safe_to_delete: true,
      seeded_by: 'seed-one-rupee-product.js',
    },
  };

  const existing = await prisma.product.findUnique({
    where: { slug: TEST_PRODUCT_SLUG },
    select: { product_id: true },
  });

  let product;

  if (existing) {
    product = await prisma.product.update({
      where: { product_id: existing.product_id },
      data: {
        ...commonData,
        creator: { connect: { creator_id: creator.creator_id } },
      },
    });

    await prisma.productImage.deleteMany({
      where: { product_id: product.product_id },
    });

    await prisma.productImage.create({
      data: {
        product_id: product.product_id,
        url: TEST_PRODUCT_IMAGE_URL,
        order_index: 0,
        is_primary: true,
      },
    });
  } else {
    product = await prisma.product.create({
      data: {
        ...commonData,
        slug: TEST_PRODUCT_SLUG,
        creator: { connect: { creator_id: creator.creator_id } },
        images: {
          create: [
            {
              url: TEST_PRODUCT_IMAGE_URL,
              order_index: 0,
              is_primary: true,
            },
          ],
        },
      },
    });
  }

  const sellingPriceCents =
    TEST_PRODUCT_PRICE_CENTS +
    Math.round(
      TEST_PRODUCT_PRICE_CENTS *
        (TEST_PRODUCT_COMMISSION_PERCENTAGE / 100),
    );

  console.log('');
  console.log('1-rupee test product is ready.');
  console.log(`Product ID   : ${product.product_id}`);
  console.log(`Title        : ${TEST_PRODUCT_TITLE}`);
  console.log(`Slug         : ${TEST_PRODUCT_SLUG}`);
  console.log(`Creator Email: ${TEST_CREATOR_EMAIL}`);
  console.log(`Image URL    : ${TEST_PRODUCT_IMAGE_URL}`);
  console.log(
    `Base Price   : ₹${(TEST_PRODUCT_PRICE_CENTS / 100).toFixed(2)}`,
  );
  console.log(`Commission   : ${TEST_PRODUCT_COMMISSION_PERCENTAGE}%`);
  console.log(
    `Selling Price: ₹${(sellingPriceCents / 100).toFixed(2)}`,
  );
  console.log(`Inventory    : ${TEST_PRODUCT_INVENTORY}`);
  console.log('');
}

upsertTestProduct()
  .catch((error) => {
    console.error('Failed to seed 1-rupee test product:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
