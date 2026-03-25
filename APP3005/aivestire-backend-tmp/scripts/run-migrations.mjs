#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import process from 'node:process';

import { PrismaClient } from '@prisma/client';

const PRISMA_CLI = './node_modules/prisma/build/index.js';
const KNOWN_PREAPPLIED_MIGRATION = '20260215_add_refund_return_replacement';
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

async function hasRefundReplacementSchema() {
  const prisma = new PrismaClient();

  try {
    const [tableRows, columnRows] = await Promise.all([
      prisma.$queryRaw`
        SELECT
          to_regclass('public.order_refunds') IS NOT NULL AS has_order_refunds,
          to_regclass('public.order_returns') IS NOT NULL AS has_order_returns,
          to_regclass('public.order_replacements') IS NOT NULL AS has_order_replacements
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
    let refundMigrationRecorded = false;
    let refundSchemaExists = false;

    try {
      failedMigrations = await getFailedMigrations();
      refundMigrationRecorded = await isMigrationRecorded(KNOWN_PREAPPLIED_MIGRATION);
      refundSchemaExists = await hasRefundReplacementSchema();
    } catch (error) {
      process.stderr.write(
        `[migrate-startup] Unable to inspect migration history after failed deploy: ${String(error?.message || error)}\n`,
      );
      process.exit(deployStatus);
    }

    if (failedMigrations.includes(KNOWN_PREAPPLIED_MIGRATION) && refundSchemaExists) {
      process.stdout.write(
        `[migrate-startup] Marking duplicate consolidated migration as applied: ${KNOWN_PREAPPLIED_MIGRATION}\n`,
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

    if (!refundMigrationRecorded && refundSchemaExists) {
      process.stdout.write(
        `[migrate-startup] Marking known consolidated migration as applied: ${KNOWN_PREAPPLIED_MIGRATION}\n`,
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
