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
const assetsRoot = path.resolve(__dirname, '..', '..', '..', 'assets');
const avatarPath = path.join(
  assetsRoot,
  'male_updated_collection',
  'pulkit001.jpeg',
);
const looks = [
  {
    slug: 'male-collection-look-2',
    file: path.join(assetsRoot, 'MALE collection', 'male2.png'),
    priority: 1,
  },
  {
    slug: 'male-collection-look-3',
    file: path.join(assetsRoot, 'MALE collection', 'male3.png'),
    priority: 2,
  },
  {
    slug: 'male-collection-look-1',
    file: path.join(assetsRoot, 'MALE collection', 'male1.png'),
    priority: 3,
  },
  {
    slug: 'ice-blue-embroidered-bandhgala',
    file: path.join(assetsRoot, 'male_updated_collection', 'item11.jpeg'),
    priority: 4,
  },
  {
    slug: 'midnight-floral-bandhgala',
    file: path.join(assetsRoot, 'male_updated_collection', 'item12.jpeg'),
    priority: 5,
    preserveClothingModel: true,
  },
];

const getMimeType = (filePath: string) =>
  path.extname(filePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

const asDataUri = (filePath: string) =>
  `data:${getMimeType(filePath)};base64,${fs.readFileSync(filePath).toString('base64')}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

async function upload(file: string, publicId: string) {
  return cloudinary.uploader.upload(file, {
    folder: 'aivestire/demo/pulkit',
    public_id: publicId,
    overwrite: true,
    invalidate: true,
    resource_type: 'image',
    transformation: [{ width: 1200, crop: 'limit', quality: 'auto:good' }],
    eager: [
      {
        width: 960,
        crop: 'limit',
        quality: 'auto:good',
        fetch_format: 'auto',
      },
    ],
    tags: ['aivestire', 'static-demo', 'pulkit'],
  });
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
  for (const file of [avatarPath, ...looks.map((look) => look.file)]) {
    if (!fs.existsSync(file)) throw new Error(`Missing demo image: ${file}`);
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const avatarUpload = await upload(avatarPath, 'pulkit-avatar');
  console.log(`Avatar uploaded: ${avatarUpload.secure_url}`);

  const tryOn = new DirectGeminiTryOnService(
    new ConfigService(process.env),
    new ImageOptimizerService(),
  );
  const force = process.env.FORCE_REGENERATE_PULKIT_DEMO === 'true';
  const generated: Array<{ slug: string; resultImage: string }> = [];

  for (const look of looks) {
    const product = await prisma.product.findUnique({
      where: { slug: look.slug },
      select: { product_id: true, title: true, metadata: true },
    });
    if (!product) throw new Error(`Product not found: ${look.slug}`);

    const metadata = isRecord(product.metadata) ? product.metadata : {};
    const existingResult =
      typeof metadata.pulkit_demo_tryon_url === 'string'
        ? metadata.pulkit_demo_tryon_url
        : '';
    let resultImage = existingResult;

    if (!resultImage || force) {
      console.log(`Generating static try-on for ${product.title}...`);
      const result = await tryOn.processTryOn(
        asDataUri(avatarPath),
        asDataUri(look.file),
        {
          maskClothingModel: !look.preserveClothingModel,
          forceRegenerate: true,
          aura_attributes: {
            height_cm: 178,
            weight_kg: 74,
            skin_tone: 'MEDIUM',
            gender: 'male',
            body_shape: 'RECTANGLE',
            body_size: 'M',
            age_range: '26-35',
            hair_style: 'SHORT_WAVY',
            beard: true,
          },
        },
      );
      if (!result.success || !result.resultImage) {
        throw new Error(`Try-on generation failed for ${product.title}`);
      }
      const uploaded = await upload(
        result.resultImage,
        `tryon-${look.priority}-${look.slug}`,
      );
      resultImage = uploaded.secure_url;
    } else {
      console.log(`Keeping existing static try-on for ${product.title}`);
    }

    await prisma.product.update({
      where: { product_id: product.product_id },
      data: {
        metadata: {
          ...metadata,
          pulkit_demo_tryon_url: resultImage,
          pulkit_demo_priority: look.priority,
          pulkit_demo_email: 'pulkitgupta6677@gmail.com',
          pulkit_demo_runtime_ai: false,
        },
      },
    });
    generated.push({ slug: look.slug, resultImage });
  }

  console.log(
    JSON.stringify(
      {
        avatar: avatarUpload.secure_url,
        transformedAvatar:
          'https://res.cloudinary.com/dxfxicebq/image/upload/f_auto,q_auto:good,w_960/aivestire/demo/pulkit/pulkit-avatar',
        looks: generated,
      },
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
