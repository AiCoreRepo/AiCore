// ============================================
// RAZORPAY GATEWAY SERVICE
// ============================================

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { BasePaymentService } from './base-payment.service';
import { RAZORPAY_CONSTANTS } from '../constants/payment.constants';

/**
 * Razorpay-specific gateway service.
 * Handles all direct communication with the Razorpay API.
 * Extends BasePaymentService to fulfill the gateway contract.
 */
@Injectable()
export class RazorpayGatewayService extends BasePaymentService {
  private readonly razorpay: Razorpay;
  private readonly keyId: string;
  private readonly keySecret: string;

  constructor(private readonly configService: ConfigService) {
    super('RazorpayGatewayService');

    this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID', '');
    this.keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET', '');

    if (!this.keyId || !this.keySecret) {
      this.logger.warn(
        'Razorpay credentials not configured. Payment features will be unavailable.',
      );
    }

    this.razorpay = new Razorpay({
      key_id: this.keyId,
      key_secret: this.keySecret,
    });
  }

  /**
   * Get the Razorpay Key ID (safe to expose to frontend)
   */
  getKeyId(): string {
    return this.keyId;
  }

  // ============================================
  // ORDER MANAGEMENT
  // ============================================

  /**
   * Create a Razorpay order
   * @param amount - Amount in paise
   * @param currency - Currency code (INR)
   * @param receipt - Unique receipt ID
   * @param notes - Optional metadata
   */
  async createOrder(
    amount: number,
    currency: string = RAZORPAY_CONSTANTS.CURRENCY,
    receipt: string,
    notes?: Record<string, string>,
  ): Promise<any> {
    try {
      this.logPaymentEvent('CREATE_ORDER', { amount, currency, receipt });

      const order = await this.razorpay.orders.create({
        amount,
        currency,
        receipt,
        notes: notes || {},
        payment_capture: true, // Auto-capture payment
      });

      this.logger.log(`Razorpay order created: ${order.id}`);
      return order;
    } catch (error: any) {
      this.logger.error(
        `Failed to create Razorpay order: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Payment gateway error: ${error.error?.description || error.message}`,
      );
    }
  }

  // ============================================
  // PAYMENT VERIFICATION
  // ============================================

  /**
   * Verify Razorpay payment signature using HMAC-SHA256
   * This is the most critical security check - prevents payment fraud
   */
  verifyPaymentSignature(params: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): boolean {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        params;

      // Generate expected signature
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(body)
        .digest('hex');

      // Constant-time comparison to prevent timing attacks
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(razorpay_signature, 'hex'),
      );

      this.logger.log(
        `Signature verification for payment ${razorpay_payment_id}: ${isValid ? 'VALID' : 'INVALID'}`,
      );

      return isValid;
    } catch (error: any) {
      this.logger.error(`Signature verification error: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify webhook signature from Razorpay
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      const webhookSecret = this.configService.get<string>(
        'RAZORPAY_WEBHOOK_SECRET',
        '',
      );
      if (!webhookSecret) {
        this.logger.warn('Webhook secret not configured');
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(signature, 'hex'),
      );
    } catch (error: any) {
      this.logger.error(
        `Webhook signature verification error: ${error.message}`,
      );
      return false;
    }
  }

  // ============================================
  // PAYMENT FETCH
  // ============================================

  /**
   * Fetch payment details from Razorpay
   */
  async fetchPayment(paymentId: string): Promise<any> {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch payment ${paymentId}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        `Failed to fetch payment details: ${error.message}`,
      );
    }
  }

  /**
   * Fetch Razorpay order details
   */
  async fetchOrder(razorpayOrderId: string): Promise<any> {
    try {
      const order = await this.razorpay.orders.fetch(razorpayOrderId);
      return order;
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch Razorpay order ${razorpayOrderId}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        `Failed to fetch order details: ${error.message}`,
      );
    }
  }

  // ============================================
  // REFUND MANAGEMENT
  // ============================================

  /**
   * Initiate a refund via Razorpay
   * @param paymentId - Razorpay payment ID
   * @param amount - Amount in paise (optional, full refund if not provided)
   * @param notes - Optional metadata
   */
  async initiateRefund(
    paymentId: string,
    amount?: number,
    notes?: Record<string, string>,
  ): Promise<any> {
    try {
      this.logPaymentEvent('INITIATE_REFUND', { paymentId, amount });

      const refundData: any = {
        speed: 'normal', // 'normal' (5-7 days) or 'optimum' (instant, extra fee)
        notes: notes || {},
      };

      if (amount) {
        refundData.amount = amount;
      }

      const refund = await this.razorpay.payments.refund(paymentId, refundData);
      this.logger.log(
        `Refund initiated: ${refund.id} for payment ${paymentId}`,
      );
      return refund;
    } catch (error: any) {
      this.logger.error(
        `Failed to initiate refund for ${paymentId}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        `Refund failed: ${error.error?.description || error.message}`,
      );
    }
  }
}
