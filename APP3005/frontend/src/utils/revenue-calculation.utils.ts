/**
 * Revenue Calculation Utilities (Frontend)
 *
 * Mirrors the backend utility for client-side calculations,
 * useful for dashboards, charts and local data transformations.
 *
 * All monetary amounts are in PAISE to avoid float precision issues.
 * Always divide by 100 before displaying.
 */

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface OrderItemInput {
  productId: string;
  creatorId: string;
  /** Unit price in paise */
  unitPricePaise: number;
  quantity: number;
}

export interface OrderInput {
  orderId: string;
  paymentStatus: string;
  currentStatus: string;
  items: OrderItemInput[];
}

// ─── Output Types ─────────────────────────────────────────────────────────────

export interface ProductSalesSummary {
  productId: string;
  unitsSold: number;
  revenuePaise: number;
  revenueFormatted: string;
}

export interface CreatorRevenueSummary {
  totalRevenuePaise: number;
  totalRevenueFormatted: string;
  totalProductsSold: number;
  productWiseSales: ProductSalesSummary[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ELIGIBLE_PAYMENT_STATUSES = new Set(['COMPLETED']);
const CANCELLED_STATUSES = new Set(['CANCELLED']);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format paise to INR currency string
 * e.g. 49900 → "₹499.00"
 */
export function formatPaiseToINR(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(paise / 100);
}

function isEligibleOrder(order: OrderInput): boolean {
  if (!ELIGIBLE_PAYMENT_STATUSES.has(order.paymentStatus)) return false;
  if (CANCELLED_STATUSES.has(order.currentStatus)) return false;
  return true;
}

function buildEmptySummary(): CreatorRevenueSummary {
  return {
    totalRevenuePaise: 0,
    totalRevenueFormatted: formatPaiseToINR(0),
    totalProductsSold: 0,
    productWiseSales: [],
  };
}

// ─── Core Calculation ─────────────────────────────────────────────────────────

/**
 * Calculate revenue analytics for a single creator from a list of orders.
 *
 * @param creatorId  Target creator ID
 * @param orders     Array of orders each with items
 * @returns CreatorRevenueSummary
 *
 * @example
 * const summary = calculateCreatorRevenue('creator-id', orders);
 * console.log(summary.totalRevenueFormatted); // "₹12,300.00"
 * console.log(summary.totalProductsSold);     // 42
 */
export function calculateCreatorRevenue(
  creatorId: string,
  orders: OrderInput[],
): CreatorRevenueSummary {
  if (!orders?.length) return buildEmptySummary();

  const productMap = new Map<string, { unitsSold: number; revenuePaise: number }>();

  for (const order of orders) {
    if (!isEligibleOrder(order)) continue;

    for (const item of order.items) {
      if (item.creatorId !== creatorId) continue;

      const lineTotalPaise = item.unitPricePaise * item.quantity;
      const existing = productMap.get(item.productId) ?? { unitsSold: 0, revenuePaise: 0 };

      productMap.set(item.productId, {
        unitsSold: existing.unitsSold + item.quantity,
        revenuePaise: existing.revenuePaise + lineTotalPaise,
      });
    }
  }

  let totalRevenuePaise = 0;
  let totalProductsSold = 0;
  const productWiseSales: ProductSalesSummary[] = [];

  for (const [productId, data] of productMap.entries()) {
    totalRevenuePaise += data.revenuePaise;
    totalProductsSold += data.unitsSold;
    productWiseSales.push({
      productId,
      unitsSold: data.unitsSold,
      revenuePaise: data.revenuePaise,
      revenueFormatted: formatPaiseToINR(data.revenuePaise),
    });
  }

  // Sort by highest revenue first
  productWiseSales.sort((a, b) => b.revenuePaise - a.revenuePaise);

  return {
    totalRevenuePaise,
    totalRevenueFormatted: formatPaiseToINR(totalRevenuePaise),
    totalProductsSold,
    productWiseSales,
  };
}

/**
 * Calculate revenue for multiple creators in a single pass (efficient).
 * Returns a Map of creatorId → CreatorRevenueSummary.
 *
 * @example
 * const bulkSummary = calculateBulkCreatorRevenue(['id1', 'id2'], orders);
 * const creator1Revenue = bulkSummary.get('id1');
 */
export function calculateBulkCreatorRevenue(
  creatorIds: string[],
  orders: OrderInput[],
): Map<string, CreatorRevenueSummary> {
  const creatorSet = new Set(creatorIds);
  const productMaps = new Map<
    string,
    Map<string, { unitsSold: number; revenuePaise: number }>
  >();

  for (const id of creatorIds) productMaps.set(id, new Map());

  if (!orders?.length) {
    const result = new Map<string, CreatorRevenueSummary>();
    for (const id of creatorIds) result.set(id, buildEmptySummary());
    return result;
  }

  // Single-pass accumulation
  for (const order of orders) {
    if (!isEligibleOrder(order)) continue;

    for (const item of order.items) {
      if (!creatorSet.has(item.creatorId)) continue;

      const pMap = productMaps.get(item.creatorId)!;
      const lineTotalPaise = item.unitPricePaise * item.quantity;
      const existing = pMap.get(item.productId) ?? { unitsSold: 0, revenuePaise: 0 };

      pMap.set(item.productId, {
        unitsSold: existing.unitsSold + item.quantity,
        revenuePaise: existing.revenuePaise + lineTotalPaise,
      });
    }
  }

  // Build final summaries
  const result = new Map<string, CreatorRevenueSummary>();

  for (const [creatorId, pMap] of productMaps.entries()) {
    let totalRevenuePaise = 0;
    let totalProductsSold = 0;
    const productWiseSales: ProductSalesSummary[] = [];

    for (const [productId, data] of pMap.entries()) {
      totalRevenuePaise += data.revenuePaise;
      totalProductsSold += data.unitsSold;
      productWiseSales.push({
        productId,
        unitsSold: data.unitsSold,
        revenuePaise: data.revenuePaise,
        revenueFormatted: formatPaiseToINR(data.revenuePaise),
      });
    }

    productWiseSales.sort((a, b) => b.revenuePaise - a.revenuePaise);

    result.set(creatorId, {
      totalRevenuePaise,
      totalRevenueFormatted: formatPaiseToINR(totalRevenuePaise),
      totalProductsSold,
      productWiseSales,
    });
  }

  return result;
}
