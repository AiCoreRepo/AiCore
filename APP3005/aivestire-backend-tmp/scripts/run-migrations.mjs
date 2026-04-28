#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import process from 'node:process';

import { PrismaClient } from '@prisma/client';

import { loadLocalEnvFiles } from './load-env.mjs';

loadLocalEnvFiles();

const PRISMA_CLI = './node_modules/prisma/build/index.js';
const KNOWN_PREAPPLIED_MIGRATION = '0001_init';
const KNOWN_FAILED_MIGRATION = '20260228000000_add_coupon_scopes';
const MAX_RECOVERY_ATTEMPTS = 5;

function runPrismaMigrate(args) {
  const result = spawnSync('node', [PRISMA_CLI, 'migrate', ...args], {
    env: process.env,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

async function isMigrationRecorded(migrationName) {
  const prisma = new PrismaClient();

  try {
    const rows = await prisma.$queryRaw`
      SELECT 1
      FROM "_prisma_migrations"
      WHERE migration_name = ${migrationName}
      LIMIT 1
    `;

    return Array.isArray(rows) && rows.length > 0;
  } finally {
    await prisma.$disconnect();
  }
}

async function getFailedMigrations() {
  const prisma = new PrismaClient();

  try {
    const rows = await prisma.$queryRaw`
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE finished_at IS NULL
        AND rolled_back_at IS NULL
      ORDER BY started_at ASC
    `;

    return Array.isArray(rows)
      ? rows
          .map((row) => row?.migration_name)
          .filter((migrationName) => typeof migrationName === 'string')
      : [];
  } finally {
    await prisma.$disconnect();
  }
}

async function hasBaselineSchema() {
  const prisma = new PrismaClient();

  try {
    const [tableRows, columnRows] = await Promise.all([
      prisma.$queryRaw`
        SELECT
          EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'User'
          ) AS has_user_table,
          EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'Creator'
          ) AS has_creator_table,
          EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'Product'
          ) AS has_product_table,
          EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'orders'
          ) AS has_orders_table,
          EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'payment_transactions'
          ) AS has_payment_transactions_table,
          EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'order_refunds'
          ) AS has_order_refunds,
          EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'order_returns'
          ) AS has_order_returns,
          EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'order_replacements'
          ) AS has_order_replacements
      `,
      prisma.$queryRaw`
        SELECT
          EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'orders'
              AND column_name = 'refund_status'
          ) AS has_refund_status,
          EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'orders'
              AND column_name = 'return_status'
          ) AS has_return_status,
          EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'orders'
              AND column_name = 'replace_status'
          ) AS has_replace_status
      `,
    ]);

    const tables = Array.isArray(tableRows) ? tableRows[0] : null;
    const columns = Array.isArray(columnRows) ? columnRows[0] : null;

    return Boolean(
      tables?.has_user_table &&
        tables?.has_creator_table &&
        tables?.has_product_table &&
        tables?.has_orders_table &&
        tables?.has_payment_transactions_table &&
        tables?.has_order_refunds &&
        tables?.has_order_returns &&
        tables?.has_order_replacements &&
        columns?.has_refund_status &&
        columns?.has_return_status &&
        columns?.has_replace_status,
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  for (let attempt = 1; attempt <= MAX_RECOVERY_ATTEMPTS; attempt += 1) {
    const deployStatus = runPrismaMigrate(['deploy']);

    if (deployStatus === 0) {
      process.exit(0);
    }

    let failedMigrations = [];
    let baselineMigrationRecorded = false;
    let baselineSchemaExists = false;

    try {
      failedMigrations = await getFailedMigrations();
      baselineMigrationRecorded = await isMigrationRecorded(
        KNOWN_PREAPPLIED_MIGRATION,
      );
      baselineSchemaExists = await hasBaselineSchema();
    } catch (error) {
      process.stderr.write(
        `[migrate-startup] Unable to inspect migration history after failed deploy: ${String(error?.message || error)}\n`,
      );
      process.exit(deployStatus);
    }

    if (
      failedMigrations.includes(KNOWN_PREAPPLIED_MIGRATION) &&
      baselineSchemaExists
    ) {
      process.stdout.write(
        `[migrate-startup] Marking consolidated baseline migration as applied: ${KNOWN_PREAPPLIED_MIGRATION}\n`,
      );

      const resolveStatus = runPrismaMigrate([
        'resolve',
        '--applied',
        KNOWN_PREAPPLIED_MIGRATION,
      ]);

      if (resolveStatus !== 0) {
        process.exit(resolveStatus);
      }

      process.stdout.write('[migrate-startup] Retrying prisma migrate deploy\n');
      continue;
    }

    if (failedMigrations.includes(KNOWN_FAILED_MIGRATION)) {
      process.stdout.write(
        `[migrate-startup] Marking failed migration as rolled back: ${KNOWN_FAILED_MIGRATION}\n`,
      );

      const rollbackStatus = runPrismaMigrate([
        'resolve',
        '--rolled-back',
        KNOWN_FAILED_MIGRATION,
      ]);

      if (rollbackStatus !== 0) {
        process.exit(rollbackStatus);
      }

      process.stdout.write('[migrate-startup] Retrying prisma migrate deploy\n');
      continue;
    }

    if (!baselineMigrationRecorded && baselineSchemaExists) {
      process.stdout.write(
        `[migrate-startup] Baseline schema detected; marking ${KNOWN_PREAPPLIED_MIGRATION} as applied\n`,
      );

      const resolveStatus = runPrismaMigrate([
        'resolve',
        '--applied',
        KNOWN_PREAPPLIED_MIGRATION,
      ]);

      if (resolveStatus !== 0) {
        process.exit(resolveStatus);
      }

      process.stdout.write('[migrate-startup] Retrying prisma migrate deploy\n');
      continue;
    }

    process.stderr.write(
      `[migrate-startup] Unhandled migration failure after attempt ${attempt}/${MAX_RECOVERY_ATTEMPTS}; leaving the original Prisma error in place.\n`,
    );
    process.exit(deployStatus);
  }

  process.stderr.write(
    `[migrate-startup] Exhausted recovery attempts after ${MAX_RECOVERY_ATTEMPTS} prisma deploy retries.\n`,
  );
  process.exit(1);
}

main().catch((error) => {
  process.stderr.write(`${String(error?.message || error)}\n`);
  process.exit(1);
});
