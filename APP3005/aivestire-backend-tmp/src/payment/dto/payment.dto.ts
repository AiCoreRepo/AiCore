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
} from 'class-validator';

/**
 * DTO for initiating a PayU payment transaction
 */
export class InitiatePaymentDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;
}

/**
 * DTO for verifying payment after PayU postback
 * Note: PayU sends these fields in a urlencoded POST request
 */
export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  txnid: string;

  @IsString()
  @IsNotEmpty()
  hash: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  mihpayid: string;

  @IsString()
  @IsNotEmpty()
  amount: string;

  @IsString()
  @IsNotEmpty()
  productinfo: string;

  @IsString()
  @IsNotEmpty()
  firstname: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  error_code?: string;

  @IsString()
  @IsOptional()
  error_Message?: string;

  @IsString()
  @IsOptional()
  additional_charges?: string;

  @IsString()
  @IsOptional()
  splitInfo?: string;
  
  // PayU sends UDFs which are optional
  @IsString()
  @IsOptional()
  udf1?: string;
  
  @IsString()
  @IsOptional()
  udf2?: string;
  
  @IsString()
  @IsOptional()
  udf3?: string;
  
  @IsString()
  @IsOptional()
  udf4?: string;
  
  @IsString()
  @IsOptional()
  udf5?: string;
}

/**
 * DTO for initiating a refund via PayU
 */
export class InitiateRefundDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  reason?: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface CreatePayUOrderResponse {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  hash: string;
  action: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  orderId: string;
  orderNumber: string;
  paymentId: string;
  message: string;
}
