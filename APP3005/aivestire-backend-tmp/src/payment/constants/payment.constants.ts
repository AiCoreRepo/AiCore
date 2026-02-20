// ============================================
// PAYMENT CONSTANTS
// ============================================

/**
 * Razorpay configuration constants
 */
export const RAZORPAY_CONSTANTS = {
    /** Currency for all transactions (ISO 4217) */
    CURRENCY: 'INR',

    /** Razorpay order receipt prefix */
    RECEIPT_PREFIX: 'AIV_',

    /** Payment expiry in seconds (15 minutes) */
    PAYMENT_EXPIRY_SECONDS: 15 * 60,

    /** Maximum retry attempts for payment verification */
    MAX_VERIFICATION_RETRIES: 3,

    /** Razorpay API base URL */
    API_BASE_URL: 'https://api.razorpay.com/v1',

    /** Minimum order amount in paise (₹1) */
    MIN_AMOUNT_PAISE: 100,

    /** Maximum order amount in paise (₹5,00,000) */
    MAX_AMOUNT_PAISE: 50_000_000,
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
    ORDER_CREATED: 'Razorpay order created successfully',
    PAYMENT_VERIFIED: 'Payment verified and captured successfully',
    PAYMENT_FAILED: 'Payment verification failed',
    REFUND_INITIATED: 'Refund initiated successfully',
    ALREADY_PAID: 'This order has already been paid',
    INVALID_SIGNATURE: 'Payment signature verification failed',
    WEBHOOK_PROCESSED: 'Webhook event processed successfully',
} as const;

/**
 * Razorpay checkout configuration defaults
 */
export const RAZORPAY_CHECKOUT_CONFIG = {
    name: 'Aivestire',
    description: 'Fashion & Lifestyle Purchase',
    image: '/logo.png',
    theme: {
        color: '#D4AF37', // Brand gold
    },
    prefill: {
        name: '',
        email: '',
        contact: '',
    },
} as const;
