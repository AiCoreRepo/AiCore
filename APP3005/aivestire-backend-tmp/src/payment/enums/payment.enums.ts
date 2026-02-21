// ============================================
// PAYMENT ENUMS
// ============================================

/**
 * Payment gateway providers supported by the system
 */
export enum PaymentGateway {
  RAZORPAY = 'RAZORPAY',
  COD = 'COD',
}

/**
 * Internal payment status lifecycle
 */
export enum PaymentTransactionStatus {
  CREATED = 'CREATED', // Order created in gateway
  ATTEMPTED = 'ATTEMPTED', // User initiated payment
  AUTHORIZED = 'AUTHORIZED', // Payment authorized (captured pending)
  CAPTURED = 'CAPTURED', // Payment fully captured/completed
  FAILED = 'FAILED', // Payment failed
  REFUNDED = 'REFUNDED', // Payment refunded
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  CANCELLED = 'CANCELLED', // Payment cancelled before completion
}

/**
 * Razorpay-specific webhook event types
 */
export enum RazorpayWebhookEvent {
  PAYMENT_AUTHORIZED = 'payment.authorized',
  PAYMENT_CAPTURED = 'payment.captured',
  PAYMENT_FAILED = 'payment.failed',
  ORDER_PAID = 'order.paid',
  REFUND_CREATED = 'refund.created',
  REFUND_PROCESSED = 'refund.processed',
  REFUND_FAILED = 'refund.failed',
}

/**
 * Razorpay payment method types
 */
export enum RazorpayPaymentMethod {
  CARD = 'card',
  NETBANKING = 'netbanking',
  WALLET = 'wallet',
  UPI = 'upi',
  EMI = 'emi',
}
