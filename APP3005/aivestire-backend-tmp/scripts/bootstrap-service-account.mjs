#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { loadLocalEnvFiles } from './load-env.mjs';

loadLocalEnvFiles();

const DEFAULT_TARGET_PATH = path.join(process.cwd(), 'service_account.json');

function resolveTargetPath() {
  const configuredPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.VERTEX_SA_KEY_PATH ||
    DEFAULT_TARGET_PATH;

  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);
}

function resolveFallbackPath() {
  const configuredPath =
    process.env.SERVICE_ACCOUNT_FALLBACK_PATH ||
    path.join(process.cwd(), 'runtime-config', 'service_account.json');

  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);
}

function getInlineCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (raw) {
    return raw;
  }

  const encoded =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64?.trim() ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64?.trim();

  if (!encoded) {
    return null;
  }

  return Buffer.from(encoded, 'base64').toString('utf-8');
}

function copyFallbackCredentials(sourcePath, targetPath) {
  if (!fs.existsSync(sourcePath)) {
    return false;
  }

  const stats = fs.statSync(sourcePath);
  if (!stats.isFile()) {
    process.stderr.write(
      `[service-account-bootstrap] Fallback path exists but is not a file: ${sourcePath}\n`,
    );
    return false;
  }

  if (sourcePath === targetPath) {
    process.stdout.write(
      `[service-account-bootstrap] Using existing service account file at ${targetPath}\n`,
    );
    return true;
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);

  try {
    fs.chmodSync(targetPath, 0o600);
  } catch {
    // Best effort only. Some filesystems may not allow chmod here.
  }

  process.stdout.write(
    `[service-account-bootstrap] Copied service account from ${sourcePath} to ${targetPath}\n`,
  );
  return true;
}

function main() {
  const targetPath = resolveTargetPath();
  const inlineCredentials = getInlineCredentials();

  if (!inlineCredentials) {
    const fallbackPath = resolveFallbackPath();
    if (copyFallbackCredentials(fallbackPath, targetPath)) {
      return;
    }

    process.stdout.write(
      '[service-account-bootstrap] No inline or fallback Vertex credentials detected. Skipping bootstrap.\n',
    );
    return;
  }

  try {
    JSON.parse(inlineCredentials);
  } catch (error) {
    process.stderr.write(
      `[service-account-bootstrap] Invalid inline Vertex credentials: ${String(error?.message || error)}\n`,
    );
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, `${inlineCredentials}\n`, {
    encoding: 'utf-8',
    mode: 0o600,
  });

  process.stdout.write(
    `[service-account-bootstrap] Wrote Vertex credentials to ${targetPath}\n`,
  );
}

main();
