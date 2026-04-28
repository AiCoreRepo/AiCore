#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

export function loadLocalEnvFiles() {
  const envSuffix = process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : '';
  const envFiles = [
    envSuffix ? `.env${envSuffix}.local` : null,
    '.env.local',
    envSuffix ? `.env${envSuffix}` : null,
    '.env',
  ].filter(Boolean);

  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile);

    if (!fs.existsSync(envPath)) {
      continue;
    }

    process.loadEnvFile(envPath);
  }
}
