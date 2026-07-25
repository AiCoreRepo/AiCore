import fs from 'node:fs';
import path from 'node:path';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { DirectGeminiTryOnService } from '../src/ai-tryon/services/providers/direct-gemini-tryon.service';
import { ImageOptimizerService } from '../src/common/image-optimizer.service';

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
  'MALE collection',
);
const modelPath = path.join(sourceRoot, 'model.png');
const looks = [
  {
    id: 'male1',
    file: 'male1.png',
    slug: 'male-collection-look-1',
    title: 'Sky Blue Relaxed Shirt',
    subtitle: 'Light blue shirt with charcoal wide leg trousers',
  },
  {
    id: 'male2',
    file: 'male2.png',
    slug: 'male-collection-look-2',
    title: 'Midnight Tee Set',
    subtitle: 'Black tee styled with relaxed ivory trousers',
  },
  {
    id: 'male3',
    file: 'male3.png',
    slug: 'male-collection-look-3',
    title: 'Mehendi Green Kurta',
    subtitle: 'Textured green kurta paired with ivory trousers',
  },
];

const asDataUri = (filePath: string) =>
  `data:image/png;base64,${fs.readFileSync(filePath).toString('base64')}`;

async function upload(file: string, publicId: string) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await cloudinary.uploader.upload(file, {
        folder: 'aivestire/tryon/guest-demo-male',
        public_id: publicId,
        overwrite: true,
        invalidate: true,
        resource_type: 'image',
        timeout: 120_000,
        tags: ['aivestire', 'guest-tryon', 'menswear', 'pre-generated'],
      });
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw lastError;
}

async function main() {
  for (const key of [
    'DATABASE_URL',
    'GEMINI_API_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ]) {
    if (!process.env[key]) throw new Error(`${key} is required`);
  }

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

  const tryOn = new DirectGeminiTryOnService(
    new ConfigService(process.env),
    new ImageOptimizerService(),
  );
  const modelUpload = await upload(modelPath, 'model');
  const generated: Array<{
    id: string;
    productId: string;
    collectionImage: string;
    staticResultImage: string;
  }> = [];

  for (const look of looks) {
    const collectionPath = path.join(sourceRoot, look.file);
    console.log(`Generating ${look.id} through DirectGeminiTryOnService...`);
    const result = await tryOn.processTryOn(
      asDataUri(modelPath),
      asDataUri(collectionPath),
      {
        maskClothingModel: true,
        forceRegenerate: true,
        aura_attributes: { gender: 'male' },
      },
    );
    if (!result.success || !result.resultImage) {
      throw new Error(`Generation failed for ${look.id}`);
    }

    const collectionUpload = await upload(
      collectionPath,
      `${look.id}-collection`,
    );
    const resultUpload = await upload(result.resultImage, `${look.id}-result`);
    const data = {
      creator_id: creator.creator_id,
      title: look.title,
      description: look.subtitle,
      category: 'Menswear',
      price_cents: 289900,
      currency: 'INR',
      inventory_count: 25,
      status: 'APPROVED' as const,
      is_featured: true,
      is_deleted: false,
      metadata: {
        audience: 'mens',
        gender: 'male',
        department: 'menswear',
        section: 'mens',
        collection: 'Men’s Collection',
        guest_tryon_demo: true,
        guest_tryon_gender: 'male',
        demo_look_id: look.id,
        static_model_url: modelUpload.secure_url,
        static_tryon_url: resultUpload.secure_url,
        generated_by: 'DirectGeminiTryOnService',
        prompt_source: 'buildGeminiTryOnPrompt',
      },
    };

    const existing = await prisma.product.findUnique({
      where: { slug: look.slug },
    });
    const product = existing
      ? await prisma.product.update({
          where: { product_id: existing.product_id },
          data,
        })
      : await prisma.product.create({ data: { ...data, slug: look.slug } });

    await prisma.productImage.deleteMany({
      where: { product_id: product.product_id },
    });
    await prisma.productImage.create({
      data: {
        product_id: product.product_id,
        url: collectionUpload.secure_url,
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
    generated.push({
      id: look.id,
      productId: product.product_id,
      collectionImage: collectionUpload.secure_url,
      staticResultImage: resultUpload.secure_url,
    });
  }

  const replacementSlugs = looks.map((look) => look.slug);
  const oldMaleProducts = await prisma.product.findMany({
    where: {
      is_deleted: false,
      slug: { notIn: replacementSlugs },
      OR: [
        { metadata: { path: ['gender'], equals: 'male' } },
        { metadata: { path: ['audience'], equals: 'mens' } },
        { metadata: { path: ['section'], equals: 'mens' } },
      ],
    },
    select: { product_id: true },
  });
  if (oldMaleProducts.length) {
    await prisma.product.updateMany({
      where: {
        product_id: { in: oldMaleProducts.map((product) => product.product_id) },
      },
      data: { is_deleted: true, is_featured: false, status: 'ARCHIVED' },
    });
    console.log(`Archived ${oldMaleProducts.length} older men’s products.`);
  }

  console.log(
    JSON.stringify(
      { modelImage: modelUpload.secure_url, looks: generated },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
