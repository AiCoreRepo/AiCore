#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { loadLocalEnvFiles } from "./load-env.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const frontendRoot = path.resolve(__dirname, "..", "..", "frontend");

process.chdir(backendRoot);
loadLocalEnvFiles();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

for (const [name, value] of Object.entries({
  CLOUDINARY_CLOUD_NAME: cloudName,
  CLOUDINARY_API_KEY: apiKey,
  CLOUDINARY_API_SECRET: apiSecret,
})) {
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
}

const folder = "aivestire/frontend";

const assets = [
  {
    key: "upcomingFeaturePreview",
    publicId: "upcoming-feature-preview",
    file: path.join(frontendRoot, "src/assets/allimage/upcoming_image.jpeg"),
  },
  {
    key: "workflowPreview0",
    publicId: "workflow-preview-0",
    file: path.join(frontendRoot, "src/assets/allimage/0.jpeg"),
  },
  {
    key: "workflowPreview1",
    publicId: "workflow-preview-1",
    file: path.join(frontendRoot, "src/assets/allimage/1.jpeg"),
  },
  {
    key: "workflowPreview2",
    publicId: "workflow-preview-2",
    file: path.join(frontendRoot, "src/assets/allimage/2_.jpeg"),
  },
  {
    key: "workflowPreview3",
    publicId: "workflow-preview-3",
    file: path.join(frontendRoot, "src/assets/allimage/3.jpeg"),
  },
];

function buildSignature(params, secret) {
  const serialized = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(`${serialized}${secret}`).digest("hex");
}

async function uploadAsset(asset) {
  const fileBuffer = await fs.readFile(asset.file);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = buildSignature(
    {
      folder,
      invalidate: "true",
      overwrite: "true",
      public_id: asset.publicId,
      timestamp,
    },
    apiSecret,
  );

  const formData = new FormData();
  formData.append(
    "file",
    new Blob([fileBuffer], { type: "image/jpeg" }),
    path.basename(asset.file),
  );
  formData.append("api_key", apiKey);
  formData.append("folder", folder);
  formData.append("invalidate", "true");
  formData.append("overwrite", "true");
  formData.append("public_id", asset.publicId);
  formData.append("signature", signature);
  formData.append("timestamp", timestamp);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error(`Upload failed for ${asset.key}: ${await response.text()}`);
  }

  const result = await response.json();
  return result.secure_url;
}

const uploadedUrls = {};

for (const asset of assets) {
  const secureUrl = await uploadAsset(asset);
  uploadedUrls[asset.key] = secureUrl;
  console.error(`Uploaded ${asset.key} -> ${secureUrl}`);
}

process.stdout.write(`${JSON.stringify(uploadedUrls, null, 2)}\n`);
