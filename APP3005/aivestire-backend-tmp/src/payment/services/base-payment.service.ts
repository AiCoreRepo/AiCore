// ============================================
// BASE PAYMENT SERVICE
// ============================================

import { Injectable, Logger } from '@nestjs/common';

/**
 * Abstract base class for all payment gateway services.
 * Defines the contract that every payment gateway must implement.
 * Provides shared utilities like logging and amount conversion.
 */
@Injectable()
export abstract class BasePaymentService {
  protected readonly logger: Logger;

  constructor(serviceName: string) {
    this.logger = new Logger(serviceName);
  }

  // ============================================
  // ABSTRACT METHODS - Must be implemented by each gateway
  // ============================================

  /**
   * Create a payment order in the gateway
   * @param amount - Amount in paise (smallest currency unit)
   * @param currency - ISO 4217 currency code
   * @param receipt - Unique receipt identifier
   * @param notes - Optional metadata
   */
  abstract createOrder(
    amount: number,
    currency: string,
    receipt: string,
    notes?: Record<string, string>,
  ): Promise<any>;

  /**
   * Verify payment signature from gateway callback
   * @param params - Signature verification parameters
   */
  abstract verifyPaymentSignature(params: Record<string, string>): boolean;

  /**
   * Fetch payment details from gateway
   * @param paymentId - Gateway payment ID
   */
  abstract fetchPayment(paymentId: string): Promise<any>;

  /**
   * Initiate a refund for a payment
   * @param paymentId - Gateway payment ID
   * @param amount - Amount to refund in paise (optional, full refund if not provided)
   * @param notes - Optional metadata
   */
  abstract initiateRefund(
    paymentId: string,
    amount?: number,
    notes?: Record<string, string>,
  ): Promise<any>;

  // ============================================
  // SHARED UTILITIES
  // ============================================

  /**
   * Convert rupees to paise (Razorpay uses smallest unit)
   */
  protected rupeesToPaise(rupees: number): number {
    return Math.round(rupees * 100);
  }

  /**
   * Convert paise to rupees
   */
  protected paiseToRupees(paise: number): number {
    return paise / 100;
  }

  /**
   * Convert decimal amount (from DB) to paise
   * DB stores amounts as decimal (e.g., 999.00 = ₹999)
   */
  protected decimalToPaise(decimalAmount: number | string): number {
    return Math.round(Number(decimalAmount) * 100);
  }

  /**
   * Generate a unique receipt ID for Razorpay
   */
  protected generateReceipt(prefix: string, orderId: string): string {
    const timestamp = Date.now().toString().slice(-8);
    const shortId = orderId.replace(/-/g, '').slice(0, 8).toUpperCase();
    return `${prefix}${shortId}_${timestamp}`;
  }

  /**
   * Safely log payment info without exposing sensitive data
   */
  protected logPaymentEvent(event: string, data: Record<string, any>): void {
    const safeData = { ...data };
    // Remove sensitive fields
    delete safeData.signature;
    delete safeData.razorpay_signature;
    this.logger.log(`[${event}] ${JSON.stringify(safeData)}`);
  }
}
