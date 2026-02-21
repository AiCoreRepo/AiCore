// ============================================
// PAYMENT DTOs
// ============================================

import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsNumber,
  IsPositive,
  IsEnum,
} from 'class-validator';

/**
 * DTO for initiating a Razorpay payment order
 */
export class InitiatePaymentDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;
}

/**
 * DTO for verifying payment after Razorpay checkout
 */
export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  razorpay_order_id: string;

  @IsString()
  @IsNotEmpty()
  razorpay_payment_id: string;

  @IsString()
  @IsNotEmpty()
  razorpay_signature: string;

  @IsUUID()
  @IsNotEmpty()
  order_id: string; // Our internal order ID
}

/**
 * DTO for Razorpay webhook payload
 */
export class RazorpayWebhookDto {
  @IsString()
  @IsNotEmpty()
  event: string;

  payload: {
    payment?: {
      entity: RazorpayPaymentEntity;
    };
    order?: {
      entity: RazorpayOrderEntity;
    };
    refund?: {
      entity: RazorpayRefundEntity;
    };
  };
}

/**
 * DTO for initiating a refund via Razorpay
 */
export class InitiateRefundDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  amount?: number; // In paise; if not provided, full refund

  @IsString()
  @IsOptional()
  reason?: string;
}

// ============================================
// RAZORPAY ENTITY TYPES (from Razorpay API)
// ============================================

export interface RazorpayPaymentEntity {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  invoice_id: string | null;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status: string | null;
  captured: boolean;
  description: string;
  card_id: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  email: string;
  contact: string;
  notes: Record<string, string>;
  fee: number;
  tax: number;
  error_code: string | null;
  error_description: string | null;
  created_at: number;
}

export interface RazorpayOrderEntity {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpayRefundEntity {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  payment_id: string;
  notes: Record<string, string>;
  receipt: string | null;
  acquirer_data: Record<string, string>;
  created_at: number;
  batch_id: string | null;
  status: string;
  speed_processed: string;
  speed_requested: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface CreateRazorpayOrderResponse {
  razorpayOrderId: string;
  amount: number; // In paise
  currency: string;
  orderId: string; // Our internal order ID
  orderNumber: string;
  keyId: string; // Razorpay Key ID for frontend
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
}

export interface PaymentVerificationResponse {
  success: boolean;
  orderId: string;
  orderNumber: string;
  paymentId: string;
  message: string;
}
