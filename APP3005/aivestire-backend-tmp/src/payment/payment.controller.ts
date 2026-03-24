// ============================================
// PAYMENT CONTROLLER
// ============================================

import * as common from '@nestjs/common';
import * as express from 'express';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './services/payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  InitiatePaymentDto,
  VerifyPaymentDto,
  InitiateRefundDto,
  CreatePayUOrderResponse,
} from './dto/payment.dto';

@common.Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {}

  // ============================================
  // INITIATE PAYMENT
  // ============================================

  /**
   * POST /payments/initiate
   * Initiates a PayU payment for the given internal order.
   * Returns a checkout payload the frontend should auto-submit as an HTML form to PayU.
   */
  @common.Post('initiate')
  @common.UseGuards(JwtAuthGuard)
  @common.HttpCode(common.HttpStatus.CREATED)
  async initiatePayment(
    @common.Request() req: { user: { user_id: string } },
    @common.Body() dto: InitiatePaymentDto,
  ): Promise<CreatePayUOrderResponse> {
    return this.paymentService.initiatePayment(req.user.user_id, dto);
  }

  // ============================================
  // SUCCESS HANDLER
  // ============================================

  /**
   * POST /payments/success
   * PayU posts here after a successful payment (surl).
   * Validates the hash and marks the order as paid.
   * The URL is configured via PAYU_SUCCESS_URL env variable.
   *
   * No JWT guard — PayU calls this directly.
   * Hash verification inside service is mandatory.
   */
  @common.Post('success')
  async paymentSuccess(
    @common.Body() dto: VerifyPaymentDto,
    @common.Res() res: express.Response,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:8080');
    try {
      const result = await this.paymentService.handlePaymentSuccess(dto);
      res.redirect(`${frontendUrl}/payment-success?orderId=${result.orderId}&orderNumber=${encodeURIComponent(result.orderNumber)}&txnid=${encodeURIComponent(dto.txnid)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment verification failed';
      res.redirect(`${frontendUrl}/payment-failure?txnid=${encodeURIComponent(dto.txnid)}&reason=${encodeURIComponent(msg)}`);
    }
  }

  // ============================================
  // FAILURE HANDLER
  // ============================================

  /**
   * POST /payments/failure
   * PayU posts here after a failed/cancelled payment (furl).
   * Hash is verified even on failure to prevent spoofed failure callbacks.
   *
   * No JWT guard — PayU calls this directly.
   */
  @common.Post('failure')
  async paymentFailure(
    @common.Body() dto: VerifyPaymentDto,
    @common.Res() res: express.Response,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:8080');
    try {
      await this.paymentService.handlePaymentFailure(dto);
    } catch { /* still redirect */ }
    res.redirect(`${frontendUrl}/payment-failure?txnid=${encodeURIComponent(dto.txnid)}&reason=${encodeURIComponent(dto.error_Message ?? 'Payment failed')}`);
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
    @common.Request() req: { user: { user_id: string } },
    @common.Param('orderId') orderId: string,
  ) {
    return this.paymentService.getPaymentStatus(req.user.user_id, orderId);
  }

  // ============================================
  // REFUND
  // ============================================

  /**
   * POST /payments/refund
   * Marks the payment as refunded in the DB.
   * Actual PayU refund must be initiated via PayU dashboard or Refund API.
   */
  @common.Post('refund')
  @common.UseGuards(JwtAuthGuard)
  @common.HttpCode(common.HttpStatus.OK)
  async initiateRefund(
    @common.Request() req: { user: { user_id: string } },
    @common.Body() dto: InitiateRefundDto,
  ): Promise<{ message: string }> {
    return this.paymentService.initiateRefund(req.user.user_id, dto);
  }
}
