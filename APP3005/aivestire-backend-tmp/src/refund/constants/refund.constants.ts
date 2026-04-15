// ============================================
// REFUND CONSTANTS & ENUMS
// ============================================
//
// Single source of truth for all refund-related
// status labels, messages, and allowed transitions.
// Used by: RefundService, SSE payloads, email templates.
// ============================================

/**
 * Human-readable labels for each RefundStatus enum value.
 * Used in SSE payloads, admin UI, email templates, etc.
 */
export const REFUND_STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: 'Refund Initiated',
  INITIATED: 'Refund Initiated',
  PROCESSING: 'Processing Refund',
  COMPLETED: 'Refund Completed',
  FAILED: 'Refund Failed',
  REJECTED: 'Refund Rejected',
  ARCHIVED: 'Refund Archived',
} as const;

/**
 * User-facing messages describing what each status means.
 * Used in SSE event payloads and notification text.
 */
export const REFUND_STATUS_MESSAGES: Record<string, string> = {
  PENDING_REVIEW: 'Refund request received and is under review',
  INITIATED: 'Refund has been initiated',
  PROCESSING: 'Refund is being processed via PayU',
  COMPLETED: 'Refund completed successfully — amount credited to wallet',
  FAILED: 'Refund processing failed',
  REJECTED: 'Refund request was rejected by admin',
  ARCHIVED: 'Refund request has been archived',
} as const;

/**
 * Allowed state transitions for refund lifecycle.
 *
 *  PENDING_REVIEW  →  PROCESSING  (admin triggers PayU)
 *  PENDING_REVIEW  →  REJECTED    (admin rejects)
 *  PENDING_REVIEW  →  ARCHIVED    (admin archives)
 *  PROCESSING      →  COMPLETED   (PayU success / webhook)
 *  PROCESSING      →  FAILED      (PayU failure / webhook)
 */
export const REFUND_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING_REVIEW: ['PROCESSING', 'REJECTED', 'ARCHIVED'],
  INITIATED: ['PROCESSING', 'REJECTED'],
  PROCESSING: ['COMPLETED', 'FAILED'],
} as const;

/**
 * Terminal refund states (no further transitions allowed).
 */
export const REFUND_TERMINAL_STATES = ['COMPLETED', 'FAILED', 'REJECTED'] as const;

/**
 * PayU status string → internal RefundStatus mapping.
 * Used by the webhook handler.
 */
export const PAYU_REFUND_STATUS_MAP: Record<string, 'COMPLETED' | 'FAILED'> = {
  success: 'COMPLETED',
  captured: 'COMPLETED',
  refund: 'COMPLETED',
  failure: 'FAILED',
  failed: 'FAILED',
  rejected: 'FAILED',
  error: 'FAILED',
} as const;

/**
 * SSE event names used for refund notifications.
 */
export const REFUND_SSE_EVENTS = {
  REFUND_UPDATE: 'refund-update',
  CONNECTED: 'connected',
} as const;

/**
 * Cron configuration for stuck refund checker.
 */
export const REFUND_CRON_CONFIG = {
  /** Minutes after which a PROCESSING refund is considered stuck */
  STALE_THRESHOLD_MINUTES: 30,
} as const;
