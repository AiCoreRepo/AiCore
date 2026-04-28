/**
 * Revenue Calculation Utilities
 *
 * Reusable module for calculating creator-level analytics from order data.
 * All monetary values are in PAISE (smallest currency unit) to avoid
 * floating-point precision errors. Divide by 100 for display.
 */

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface OrderItemInput {
  productId: string;
  creatorId: string;
  /** Unit price in paise (e.g. 49900 = ₹499.00) */
  unitPricePaise: number;
  quantity: number;
}

export type EligibleOrderStatus = 'COMPLETED' | 'DELIVERED';

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
  /** Revenue in paise */
  revenuePaise: number;
  /** Revenue as a formatted display string (e.g. "₹4,990.00") */
  revenueFormatted: string;
}

export interface CreatorRevenueSummary {
  /** Total revenue in paise */
  totalRevenuePaise: number;
  /** Total revenue as a formatted display string */
  totalRevenueFormatted: string;
  totalProductsSold: number;
  productWiseSales: ProductSalesSummary[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ELIGIBLE_PAYMENT_STATUSES: Set<string> = new Set(['COMPLETED']);
const ELIGIBLE_ORDER_STATUSES: Set<string> = new Set([
  'DELIVERED',
  'DISPATCHED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
]);
const CANCELLED_STATUSES: Set<string> = new Set(['CANCELLED']);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Checks if an order is eligible to be counted in revenue calculations.
 * Eligibility: payment is COMPLETED and order is NOT cancelled.
 */
function isEligibleOrder(order: OrderInput): boolean {
  if (!ELIGIBLE_PAYMENT_STATUSES.has(order.paymentStatus)) return false;
  if (CANCELLED_STATUSES.has(order.currentStatus)) return false;
  return true;
}

/**
 * Formats a paise value into a human-readable INR currency string.
 * e.g. 49900 → "₹499.00"
 */
export function formatPaiseToINR(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(paise / 100);
}

// ─── Core Calculation ─────────────────────────────────────────────────────────

/**
 * Calculates revenue and products sold for a given creator from a list of orders.
 *
 * @param creatorId  - The creator whose analytics we are computing
 * @param orders     - All orders (filtered or unfiltered), each with their items
 * @returns CreatorRevenueSummary
 *
 * @example
 * const summary = calculateCreatorRevenue('creator-uuid', allOrders);
 * console.log(summary.totalRevenueFormatted); // "₹12,300.00"
 */
export function calculateCreatorRevenue(
  creatorId: string,
  orders: OrderInput[],
): CreatorRevenueSummary {
  // Guard: empty data
  if (!orders || orders.length === 0) {
    return buildEmptySummary();
  }

  // Accumulator: productId → { unitsSold, revenuePaise }
  const productMap = new Map<string, { unitsSold: number; revenuePaise: number }>();

  for (const order of orders) {
    if (!isEligibleOrder(order)) continue;

    for (const item of order.items) {
      // Only count items belonging to this creator
      if (item.creatorId !== creatorId) continue;

      const lineTotalPaise = item.unitPricePaise * item.quantity;

      const existing = productMap.get(item.productId) ?? {
        unitsSold: 0,
        revenuePaise: 0,
      };

      productMap.set(item.productId, {
        unitsSold: existing.unitsSold + item.quantity,
        revenuePaise: existing.revenuePaise + lineTotalPaise,
      });
    }
  }

  // Aggregate totals
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

  // Sort by revenue descending for easy ranking
  productWiseSales.sort((a, b) => b.revenuePaise - a.revenuePaise);

  return {
    totalRevenuePaise,
    totalRevenueFormatted: formatPaiseToINR(totalRevenuePaise),
    totalProductsSold,
    productWiseSales,
  };
}

/**
 * Calculates revenue summaries for MULTIPLE creators at once.
 * Returns a map of creatorId → CreatorRevenueSummary.
 *
 * More efficient than calling calculateCreatorRevenue() in a loop
 * since it only iterates through orders once.
 *
 * @param creatorIds - The set of creators to compute analytics for
 * @param orders     - All orders with items
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

  // Initialize all creators with empty maps
  for (const id of creatorIds) {
    productMaps.set(id, new Map());
  }

  if (!orders || orders.length === 0) {
    const result = new Map<string, CreatorRevenueSummary>();
    for (const id of creatorIds) result.set(id, buildEmptySummary());
    return result;
  }

  // Single pass over all orders
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

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function buildEmptySummary(): CreatorRevenueSummary {
  return {
    totalRevenuePaise: 0,
    totalRevenueFormatted: formatPaiseToINR(0),
    totalProductsSold: 0,
    productWiseSales: [],
  };
}
