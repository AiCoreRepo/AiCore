import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const frontendRoot = path.join(repoRoot, "APP3005", "frontend");

const baseFolder = process.argv[2] || "aivestire/frontend";

const assets = [
  {
    key: "heroFashion",
    publicId: "hero-fashion",
    file: path.join(frontendRoot, "src/assets/hero-fashion.jpg"),
  },
  {
    key: "authHeroLogin",
    publicId: "auth-hero-login",
    file: path.join(frontendRoot, "src/assets/auth-hero-login.jpg"),
  },
  {
    key: "authHeroSignup",
    publicId: "auth-hero-signup",
    file: path.join(frontendRoot, "src/assets/auth-hero-signup.jpg"),
  },
  {
    key: "authHeroForgot",
    publicId: "auth-hero-forgot",
    file: path.join(frontendRoot, "src/assets/auth-hero-forgot.jpg"),
  },
  {
    key: "aivestireAuthModel",
    publicId: "aivestire-auth-model",
    file: path.join(frontendRoot, "src/assets/aivestire-auth-model.png"),
  },
  {
    key: "collectionHeader",
    publicId: "collection-header",
    file: path.join(frontendRoot, "src/assets/collectionHeader.jpeg"),
  },
  {
    key: "iconAura",
    publicId: "icon-aura",
    file: path.join(frontendRoot, "src/assets/icon-aura.png"),
  },
  {
    key: "iconTryOn",
    publicId: "icon-tryon",
    file: path.join(frontendRoot, "src/assets/icon-tryon.png"),
  },
  {
    key: "icon360",
    publicId: "icon-360",
    file: path.join(frontendRoot, "src/assets/icon-360.png"),
  },
  {
    key: "iconStylist",
    publicId: "icon-stylist",
    file: path.join(frontendRoot, "src/assets/icon-stylist.png"),
  },
  {
    key: "tryOnNew",
    publicId: "tryon-new",
    file: path.join(frontendRoot, "src/assets/tryonnew .jpeg"),
  },
  {
    key: "upcomingFeaturePreview",
    publicId: "upcoming-feature-preview",
    file: path.join(frontendRoot, "src/assets/allimage/upcoming_new.jpeg"),
  },
  {
    key: "workflowPreview0",
    publicId: "workflow-preview-0",
    file: path.join(frontendRoot, "src/assets/allimage/00_00.jpeg"),
  },
  {
    key: "workflowPreview1",
    publicId: "workflow-preview-1",
    file: path.join(frontendRoot, "src/assets/allimage/11_11.jpeg"),
  },
  {
    key: "workflowPreview2",
    publicId: "workflow-preview-2",
    file: path.join(frontendRoot, "src/assets/allimage/22_22.jpeg"),
  },
  {
    key: "workflowPreview3",
    publicId: "workflow-preview-3",
    file: path.join(frontendRoot, "src/assets/allimage/33_33.jpeg"),
  },
  {
    key: "jaipurArtisansThread",
    publicId: "jaipur-artisans-thread",
    file: path.join(frontendRoot, "public/images/jaipur-artisans-thread.jpg"),
  },
  {
    key: "jaipurWomenCraft",
    publicId: "jaipur-women-craft",
    file: path.join(frontendRoot, "public/images/jaipur-women-craft.jpg"),
  },
  {
    key: "jaipurShopWomen",
    publicId: "jaipur-shop-women",
    file: path.join(frontendRoot, "public/images/jaipur-shop-women.jpg"),
  },
  {
    key: "jaipurStreetMural",
    publicId: "jaipur-street-mural",
    file: path.join(frontendRoot, "public/images/jaipur-street-mural.jpg"),
  },
  {
    key: "jaipurBwEmbroidery",
    publicId: "jaipur-bw-embroidery",
    file: path.join(frontendRoot, "public/images/jaipur-bw-embroidery.jpg"),
  },
  {
    key: "jaipurWomenGroup",
    publicId: "jaipur-women-group",
    file: path.join(frontendRoot, "public/images/jaipur-women-group.jpg"),
  },
  {
    key: "jaipurTextileMarket",
    publicId: "jaipur-textile-market",
    file: path.join(frontendRoot, "public/images/jaipur-textile-market.jpg"),
  },
  {
    key: "avatarArtisan1",
    publicId: "avatar-artisan-1",
    file: path.join(frontendRoot, "public/images/avatar-artisan-1.png"),
  },
  {
    key: "avatarArtisan2",
    publicId: "avatar-artisan-2",
    file: path.join(frontendRoot, "public/images/avatar-artisan-2.png"),
  },
  {
    key: "avatarArtisan3",
    publicId: "avatar-artisan-3",
    file: path.join(frontendRoot, "public/images/avatar-artisan-3.png"),
  },
  {
    key: "product1",
    publicId: "product-1",
    file: path.join(frontendRoot, "public/images/product-1.png"),
  },
  {
    key: "product2",
    publicId: "product-2",
    file: path.join(frontendRoot, "public/images/product-2.png"),
  },
  {
    key: "product3",
    publicId: "product-3",
    file: path.join(frontendRoot, "public/images/product-3.png"),
  },
  {
    key: "product4",
    publicId: "product-4",
    file: path.join(frontendRoot, "public/images/product-4.png"),
  },
  {
    key: "auraMinimal",
    publicId: "aura-minimal",
    file: path.join(frontendRoot, "public/images/aura-minimal.png"),
  },
  {
    key: "auraBold",
    publicId: "aura-bold",
    file: path.join(frontendRoot, "public/images/aura-bold.png"),
  },
  {
    key: "auraHeritage",
    publicId: "aura-heritage",
    file: path.join(frontendRoot, "public/images/aura-heritage.png"),
  },
  {
    key: "auraAvantGarde",
    publicId: "aura-avant-garde",
    file: path.join(frontendRoot, "public/images/aura-avant-garde.png"),
  },
  {
    key: "storyLoomHands",
    publicId: "story-loom-hands",
    file: path.join(frontendRoot, "public/images/story-loom-hands.png"),
  },
  {
    key: "aiBridge",
    publicId: "ai-bridge",
    file: path.join(frontendRoot, "public/images/ai-bridge.png"),
  },
  {
    key: "placeholderAvatar",
    publicId: "placeholder-avatar",
    file: path.join(frontendRoot, "public/images/avatar-artisan-1.png"),
  },
  {
    key: "skinToneGuide",
    publicId: "skin-tone-guide",
    file: path.join(frontendRoot, "public/images/skin-tone-guide.png"),
  },
  {
    key: "bodyShapesGuide",
    publicId: "body-shapes-guide",
    file: path.join(frontendRoot, "public/images/body-shapes-guide.png"),
  },
];

const requiredEnv = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];

for (const envName of requiredEnv) {
  if (!process.env[envName]) {
    console.error(`Missing required env var: ${envName}`);
    process.exit(1);
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const urls = {};

for (const asset of assets) {
  if (!fs.existsSync(asset.file)) {
    console.error(`Missing file: ${asset.file}`);
    process.exit(1);
  }

  const result = await cloudinary.uploader.upload(asset.file, {
    folder: baseFolder,
    public_id: asset.publicId,
    overwrite: true,
    invalidate: true,
    resource_type: "image",
    use_filename: false,
    unique_filename: false,
  });

  urls[asset.key] = result.secure_url;
  console.error(`Uploaded ${asset.key} -> ${result.secure_url}`);
}

process.stdout.write(`${JSON.stringify(urls, null, 2)}\n`);
