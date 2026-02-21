// ============================================
// PAYMENT CONTROLLER
// ============================================

import * as common from '@nestjs/common';
import { PaymentService } from './services/payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  InitiatePaymentDto,
  VerifyPaymentDto,
  InitiateRefundDto,
} from './dto/payment.dto';

@common.Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ============================================
  // INITIATE PAYMENT
  // ============================================

  /**
   * POST /payments/initiate
   * Creates a Razorpay order for the given internal order.
   * Returns Razorpay order ID + key for frontend checkout.
   */
  @common.Post('initiate')
  @common.UseGuards(JwtAuthGuard)
  async initiatePayment(
    @common.Request() req,
    @common.Body() dto: InitiatePaymentDto,
  ) {
    return this.paymentService.initiateRazorpayPayment(req.user.user_id, dto);
  }

  // ============================================
  // VERIFY PAYMENT
  // ============================================

  /**
   * POST /payments/verify
   * Verifies Razorpay payment signature and marks order as paid.
   * Called after user completes payment in Razorpay checkout.
   */
  @common.Post('verify')
  @common.UseGuards(JwtAuthGuard)
  async verifyPayment(
    @common.Request() req,
    @common.Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentService.verifyAndCapturePayment(req.user.user_id, dto);
  }

  // ============================================
  // PAYMENT STATUS
  // ============================================

  /**
   * GET /payments/status/:orderId
   * Returns payment status for a given order.
   */
  @common.Get('status/:orderId')
  @common.UseGuards(JwtAuthGuard)
  async getPaymentStatus(
    @common.Request() req,
    @common.Param('orderId') orderId: string,
  ) {
    return this.paymentService.getPaymentStatus(req.user.user_id, orderId);
  }

  // ============================================
  // REFUND
  // ============================================

  /**
   * POST /payments/refund
   * Initiates a refund for a completed payment.
   * Admin or user can trigger this (service handles authorization).
   */
  @common.Post('refund')
  @common.UseGuards(JwtAuthGuard)
  async initiateRefund(
    @common.Request() req,
    @common.Body() dto: InitiateRefundDto,
  ) {
    return this.paymentService.initiateRefund(req.user.user_id, dto);
  }

  // ============================================
  // RAZORPAY WEBHOOK
  // ============================================

  /**
   * POST /payments/webhook/razorpay
   * Receives Razorpay webhook events.
   * No auth guard — Razorpay calls this directly.
   * Signature verification is done inside the service.
   */
  @common.Post('webhook/razorpay')
  @common.HttpCode(common.HttpStatus.OK)
  async razorpayWebhook(
    @common.Req() req: common.RawBodyRequest<Request>,
    @common.Headers('x-razorpay-signature') signature: string,
    @common.Body() payload: any,
  ) {
    const rawBody = (req as any).rawBody?.toString() || JSON.stringify(payload);
    return this.paymentService.handleWebhook(rawBody, signature, payload);
  }
}
