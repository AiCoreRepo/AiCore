// ============================================
// PAYOUT ENUMS
// ============================================
// Single source of truth — imported by service, repository, and controller.
// Mirrors the PayoutStatus / PayoutType DB enums from Prisma schema.

/**
 * Internal payout status lifecycle.
 * Matches the Prisma PayoutStatus enum.
 */
export enum PayoutStatusEnum {
  PENDING    = 'PENDING',    // Row created, awaiting dispatch
  PROCESSING = 'PROCESSING', // Request sent to PayU
  SUCCESS    = 'SUCCESS',    // Gateway confirmed
  FAILED     = 'FAILED',     // Gateway rejected
  CANCELLED  = 'CANCELLED',  // Admin cancelled before dispatch
}

/**
 * Whether this payout covers the full pending balance or a custom partial amount.
 * Matches the Prisma PayoutType enum.
 */
export enum PayoutTypeEnum {
  FULL    = 'FULL',
  PARTIAL = 'PARTIAL',
}
