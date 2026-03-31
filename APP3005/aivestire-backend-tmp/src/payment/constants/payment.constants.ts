// ============================================
// PAYMENT CONSTANTS
// ============================================

/**
 * PayU configuration constants
 */
export const PAYU_CONSTANTS = {
  /** Currency for all transactions (ISO 4217) */
  CURRENCY: 'INR',

  /** Transaction ID prefix */
  TXN_PREFIX: 'AIV_',

  /** Base URL for PayU (test environment by default, update in env) */
  TEST_URL: 'https://test.payu.in/_payment',
  PROD_URL: 'https://secure.payu.in/_payment',

  /** Minimum order amount */
  MIN_AMOUNT: 1,

  /** Maximum order amount */
  MAX_AMOUNT: 500000,
} as const;

/**
 * Payment error codes
 */
export const PAYMENT_ERROR_CODES = {
  INVALID_SIGNATURE: 'PAYMENT_INVALID_SIGNATURE',
  ORDER_NOT_FOUND: 'PAYMENT_ORDER_NOT_FOUND',
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  ALREADY_PAID: 'PAYMENT_ALREADY_PAID',
  AMOUNT_MISMATCH: 'PAYMENT_AMOUNT_MISMATCH',
  GATEWAY_ERROR: 'PAYMENT_GATEWAY_ERROR',
  REFUND_FAILED: 'PAYMENT_REFUND_FAILED',
  INVALID_STATUS: 'PAYMENT_INVALID_STATUS',
  WEBHOOK_INVALID: 'PAYMENT_WEBHOOK_INVALID',
} as const;

/**
 * Payment success/failure messages
 */
export const PAYMENT_MESSAGES = {
  ORDER_CREATED: 'Payment transaction initialized successfully',
  PAYMENT_VERIFIED: 'Payment verified and captured successfully',
  PAYMENT_FAILED: 'Payment verification failed',
  REFUND_INITIATED: 'Refund initiated successfully',
  ALREADY_PAID: 'This order has already been paid',
  INVALID_SIGNATURE: 'Payment signature verification failed',
  WEBHOOK_PROCESSED: 'Webhook event processed successfully',
} as const;
