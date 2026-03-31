import { Decimal } from '@prisma/client/runtime/library';

// Shared interfaces for analytics statistics
export interface OrderStats {
  total_sales: number;
  creator_earnings: number;
  platform_commission: number;
  units_sold: number;
}

export interface PayoutStats {
  total_paid: number;
}

export interface CreatorFinancialSummary extends OrderStats, PayoutStats {
  pending_balance: number;
  last_payout_date: Date | null;
}

/**
 * Purpose: Convert Prisma's Decimal object or primitive number to a standard JS number
 */
export function toNumber(value: Decimal | number | null | undefined | any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (value instanceof Decimal) return value.toNumber();
  if (typeof value === 'object' && value !== null && 'toNumber' in value && typeof (value as any).toNumber === 'function') {
    return (value as any).toNumber();
  }
  return Number(value) || 0;
}

/**
 * Purpose: Calculate baseline creator analytics
 * Source: OrderItem group aggregations
 */
export function calculateCreatorAnalytics(
  orderStats: {
    _sum: {
      selling_price: Decimal | null;
      creator_price: Decimal | null;
      commission: Decimal | null;
      quantity: number | null;
    };
  } | null
): OrderStats {
  return {
    total_sales: toNumber(orderStats?._sum?.selling_price),
    creator_earnings: toNumber(orderStats?._sum?.creator_price),
    platform_commission: toNumber(orderStats?._sum?.commission),
    units_sold: orderStats?._sum?.quantity ?? 0,
  };
}

/**
 * Purpose: Calculate pending balance safely
 */
export function calculatePendingBalance(totalEarnings: number, totalPaid: number): number {
  const balance = totalEarnings - totalPaid;
  return balance > 0 ? Number(balance.toFixed(2)) : 0;
}

/**
 * Purpose: Validate if a payout amount is mathematical possible and valid
 * Rules: Cannot pay <= 0, cannot exceed pending balance
 */
export function payoutValidation(payoutAmount: number, pendingBalance: number): void {
  if (payoutAmount <= 0) {
    throw new Error('Payout amount must be greater than zero');
  }
  if (payoutAmount > pendingBalance) {
    throw new Error(`Insufficient pending balance. Requested: ${payoutAmount}, Available: ${pendingBalance}`);
  }
}
