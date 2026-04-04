#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import process from 'node:process';

import { PrismaClient } from '@prisma/client';

import { loadLocalEnvFiles } from './load-env.mjs';

loadLocalEnvFiles();

const PRISMA_CLI = './node_modules/prisma/build/index.js';
const KNOWN_PREAPPLIED_MIGRATION = '0001_init';
const MAX_RECOVERY_ATTEMPTS = 10;

const REPLACEMENT_MIGRATION_CHECKS = {
  '0002_create_coupons_table': hasCouponBaseSchema,
  '0003_add_coupon_scopes': hasCouponScopeSchema,
  '0004_add_coupon_applied_and_birthday_anniversary':
    hasCouponAnniversarySchema,
  '0005_add_wallet_system': hasWalletSchema,
  '0006_add_product_recommendation_attributes':
    hasProductRecommendationSchema,
  '0007_add_categories_and_product_groups': hasCategoryAndGroupSchema,
};

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

function firstRow(rows) {
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

async function withPrisma(callback) {
  const prisma = new PrismaClient();

  try {
    return await callback(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function tableExists(prisma, tableName) {
  const rows = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
    ) AS present
  `;

  return Boolean(firstRow(rows)?.present);
}

async function columnExists(prisma, tableName, columnName) {
  const rows = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
        AND column_name = ${columnName}
    ) AS present
  `;

  return Boolean(firstRow(rows)?.present);
}

async function enumExists(prisma, enumName) {
  const rows = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1
      FROM pg_type
      WHERE typname = ${enumName}
    ) AS present
  `;

  return Boolean(firstRow(rows)?.present);
}

async function enumValueExists(prisma, enumName, enumValue) {
  const rows = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1
      FROM pg_enum enum_value
      INNER JOIN pg_type enum_type ON enum_value.enumtypid = enum_type.oid
      WHERE enum_type.typname = ${enumName}
        AND enum_value.enumlabel = ${enumValue}
    ) AS present
  `;

  return Boolean(firstRow(rows)?.present);
}

async function constraintExists(prisma, constraintName) {
  const rows = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = ${constraintName}
    ) AS present
  `;

  return Boolean(firstRow(rows)?.present);
}

async function getAppliedMigrationNames() {
  return withPrisma(async (prisma) => {
    const rows = await prisma.$queryRaw`
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL
        AND rolled_back_at IS NULL
    `;

    return new Set(
      Array.isArray(rows)
        ? rows
            .map((row) => row?.migration_name)
            .filter((migrationName) => typeof migrationName === 'string')
        : [],
    );
  });
}

async function getReplacementMigrationsToResolve(appliedMigrationNames) {
  return withPrisma(async (prisma) => {
    const migrationsToResolve = [];

    for (const [migrationName, check] of Object.entries(
      REPLACEMENT_MIGRATION_CHECKS,
    )) {
      if (appliedMigrationNames.has(migrationName)) {
        continue;
      }

      if (await check(prisma)) {
        migrationsToResolve.push(migrationName);
      }
    }

    return migrationsToResolve;
  });
}

async function hasCouponBaseSchema(prisma) {
  const [
    hasCouponType,
    hasCouponStatus,
    hasCouponsTable,
    hasAllowedPincodesTable,
    hasCouponAllowedPincodesForeignKey,
  ] = await Promise.all([
    enumExists(prisma, 'CouponType'),
    enumExists(prisma, 'CouponStatus'),
    tableExists(prisma, 'coupons'),
    tableExists(prisma, 'coupon_allowed_pincodes'),
    constraintExists(prisma, 'coupon_allowed_pincodes_coupon_id_fkey'),
  ]);

  return Boolean(
    hasCouponType &&
      hasCouponStatus &&
      hasCouponsTable &&
      hasAllowedPincodesTable &&
      hasCouponAllowedPincodesForeignKey,
  );
}

async function hasCouponScopeSchema(prisma) {
  const [
    hasCouponScopeType,
    hasIsOneTimePerUser,
    hasIsStackable,
    hasIsDeleted,
    hasCouponScopesTable,
    hasCouponScopesForeignKey,
  ] = await Promise.all([
    enumExists(prisma, 'CouponScopeType'),
    columnExists(prisma, 'coupons', 'is_one_time_per_user'),
    columnExists(prisma, 'coupons', 'is_stackable'),
    columnExists(prisma, 'coupons', 'is_deleted'),
    tableExists(prisma, 'coupon_scopes'),
    constraintExists(prisma, 'coupon_scopes_coupon_id_fkey'),
  ]);

  return Boolean(
    hasCouponScopeType &&
      hasIsOneTimePerUser &&
      hasIsStackable &&
      hasIsDeleted &&
      hasCouponScopesTable &&
      hasCouponScopesForeignKey,
  );
}

async function hasCouponAnniversarySchema(prisma) {
  const [
    hasAppliedCouponCodeOnCarts,
    hasAppliedCouponCodeOnGuestCarts,
    hasUserBirthdayScope,
    hasCompanyAnniversaryScope,
    hasCompanyAnniversaryDate,
  ] = await Promise.all([
    columnExists(prisma, 'carts', 'applied_coupon_code'),
    columnExists(prisma, 'guest_carts', 'applied_coupon_code'),
    enumValueExists(prisma, 'CouponScopeType', 'USER_BIRTHDAY'),
    enumValueExists(prisma, 'CouponScopeType', 'COMPANY_ANNIVERSARY'),
    columnExists(prisma, 'coupon_scopes', 'company_anniversary_date'),
  ]);

  return Boolean(
    hasAppliedCouponCodeOnCarts &&
      hasAppliedCouponCodeOnGuestCarts &&
      hasUserBirthdayScope &&
      hasCompanyAnniversaryScope &&
      hasCompanyAnniversaryDate,
  );
}

async function hasWalletSchema(prisma) {
  const [
    hasWalletTransactionType,
    hasWalletTransactionSource,
    hasWalletTransactionStatus,
    hasWalletsTable,
    hasWalletTransactionsTable,
    hasWalletUserForeignKey,
    hasWalletTransactionForeignKey,
    hasWalletPaymentMethod,
  ] = await Promise.all([
    enumExists(prisma, 'WalletTransactionType'),
    enumExists(prisma, 'WalletTransactionSource'),
    enumExists(prisma, 'WalletTransactionStatus'),
    tableExists(prisma, 'wallets'),
    tableExists(prisma, 'wallet_transactions'),
    constraintExists(prisma, 'wallets_user_id_fkey'),
    constraintExists(prisma, 'wallet_transactions_wallet_id_fkey'),
    enumValueExists(prisma, 'PaymentMethod', 'WALLET'),
  ]);

  return Boolean(
    hasWalletTransactionType &&
      hasWalletTransactionSource &&
      hasWalletTransactionStatus &&
      hasWalletsTable &&
      hasWalletTransactionsTable &&
      hasWalletUserForeignKey &&
      hasWalletTransactionForeignKey &&
      hasWalletPaymentMethod,
  );
}

async function hasProductRecommendationSchema(prisma) {
  const [
    hasOccasions,
    hasBodyShapes,
    hasSkinTones,
    hasSizes,
    hasAgeRanges,
  ] = await Promise.all([
    columnExists(prisma, 'Product', 'occasions'),
    columnExists(prisma, 'Product', 'body_shapes'),
    columnExists(prisma, 'Product', 'skin_tones'),
    columnExists(prisma, 'Product', 'sizes'),
    columnExists(prisma, 'Product', 'age_ranges'),
  ]);

  return Boolean(
    hasOccasions &&
      hasBodyShapes &&
      hasSkinTones &&
      hasSizes &&
      hasAgeRanges,
  );
}

async function hasCategoryAndGroupSchema(prisma) {
  const [
    hasCategoriesTable,
    hasSubCategoriesTable,
    hasCategoryId,
    hasSubCategoryId,
    hasProductGroupsTable,
    hasProductGroupAssignmentsTable,
  ] = await Promise.all([
    tableExists(prisma, 'categories'),
    tableExists(prisma, 'sub_categories'),
    columnExists(prisma, 'Product', 'category_id'),
    columnExists(prisma, 'Product', 'sub_category_id'),
    tableExists(prisma, 'product_groups'),
    tableExists(prisma, 'product_group_assignments'),
  ]);

  return Boolean(
    hasCategoriesTable &&
      hasSubCategoriesTable &&
      hasCategoryId &&
      hasSubCategoryId &&
      hasProductGroupsTable &&
      hasProductGroupAssignmentsTable,
  );
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
  return withPrisma(async (prisma) => {
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
  });
}

async function main() {
  for (let attempt = 1; attempt <= MAX_RECOVERY_ATTEMPTS; attempt += 1) {
    const deployStatus = runPrismaMigrate(['deploy']);

    if (deployStatus === 0) {
      process.exit(0);
    }

    let failedMigrations = [];
    let appliedMigrationNames = new Set();
    let baselineMigrationRecorded = false;
    let baselineSchemaExists = false;
    let replacementMigrationsToResolve = [];

    try {
      failedMigrations = await getFailedMigrations();
      appliedMigrationNames = await getAppliedMigrationNames();
      baselineMigrationRecorded =
        appliedMigrationNames.has(KNOWN_PREAPPLIED_MIGRATION);
      baselineSchemaExists = await hasBaselineSchema();
      replacementMigrationsToResolve =
        await getReplacementMigrationsToResolve(appliedMigrationNames);
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

    if (replacementMigrationsToResolve.length > 0) {
      process.stdout.write(
        `[migrate-startup] Marking replacement migrations as applied because their schema already exists: ${replacementMigrationsToResolve.join(', ')}\n`,
      );

      for (const migrationName of replacementMigrationsToResolve) {
        const resolveStatus = runPrismaMigrate([
          'resolve',
          '--applied',
          migrationName,
        ]);

        if (resolveStatus !== 0) {
          process.exit(resolveStatus);
        }
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
