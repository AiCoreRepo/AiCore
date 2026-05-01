/**
 * fix-inventory-sync.js
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time migration: re-sync Product.inventory_count to match the sum of
 * ProductColorVariant.stock for every product that has color variants.
 *
 * Products WITHOUT any color variants (old admin-imported items) are left
 * untouched — their inventory_count is the only source of truth.
 *
 * Run with:
 *   node scripts/fix-inventory-sync.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Scanning for inventory mismatches...\n');

  // Fetch all non-deleted products that have at least one pattern (hierarchy products)
  const products = await prisma.product.findMany({
    where: { is_deleted: false },
    select: {
      product_id: true,
      title: true,
      inventory_count: true,
      status: true,
      patterns: {
        select: {
          color_variants: {
            select: { stock: true },
          },
        },
      },
    },
  });

  let fixedCount = 0;
  let skippedCount = 0;
  let alreadyCorrect = 0;

  for (const product of products) {
    // Only fix products that have color variants
    const hasVariants = product.patterns.some((p) => p.color_variants.length > 0);

    if (!hasVariants) {
      skippedCount++;
      continue;
    }

    const variantSum = product.patterns.reduce(
      (sum, p) => sum + p.color_variants.reduce((s, cv) => s + cv.stock, 0),
      0,
    );

    if (variantSum === product.inventory_count) {
      alreadyCorrect++;
      continue;
    }

    console.log(
      `  FIXING: "${product.title.substring(0, 40)}" (${product.product_id})` +
        `\n    Status: ${product.status}` +
        `\n    DB count: ${product.inventory_count} → Variant sum: ${variantSum}`,
    );

    await prisma.product.update({
      where: { product_id: product.product_id },
      data: {
        inventory_count: variantSum,
        updated_at: new Date(),
      },
    });

    fixedCount++;
  }

  console.log('\n✅ Migration complete:');
  console.log(`   Fixed:          ${fixedCount}`);
  console.log(`   Already correct: ${alreadyCorrect}`);
  console.log(`   Skipped (no variants): ${skippedCount}`);
  console.log(`   Total products scanned: ${products.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
