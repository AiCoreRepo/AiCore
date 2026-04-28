import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { RefundService } from './refund.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminJwtGuard } from '../auth/admin/guards/admin-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequestRefundDto } from './dto/request-refund.dto';
import { RefundStatus } from '@prisma/client';

@Controller('refunds')
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  /**
   * User: Request refund for their own cancelled/returned order
   * POST /refunds/:orderId
   */
  @Post(':orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async requestRefund(
    @Param('orderId') orderId: string,
    @Body() dto: RequestRefundDto,
    @Req() req: any,
  ) {
    return this.refundService.initiateRefund(orderId, req.user.user_id, dto);
  }

  /**
   * Get refund status for order (accessible by user or admin)
   * GET /refunds/order/:orderId
   */
  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async getRefundStatus(@Param('orderId') orderId: string) {
    return this.refundService.getRefundStatus(orderId);
  }

  /**
   * Admin: Get refund status for any order (via admin JWT)
   * GET /refunds/admin/order/:orderId
   */
  @Get('admin/order/:orderId')
  @UseGuards(AdminJwtGuard)
  async adminGetRefundStatus(@Param('orderId') orderId: string) {
    return this.refundService.getRefundStatus(orderId);
  }

  /**
   * Admin: Get all refunds
   * GET /refunds/admin/all?status=INITIATED
   */
  @Get('admin/all')
  @UseGuards(AdminJwtGuard)
  async getAllRefunds(@Query('status') status?: RefundStatus) {
    return this.refundService.getAllRefunds(status);
  }

  /**
   * Admin: Initiate a refund on behalf of a user (skips ownership check)
   * POST /refunds/admin/initiate/:orderId
   */
  @Post('admin/initiate/:orderId')
  @UseGuards(AdminJwtGuard)
  async adminInitiateRefund(
    @Param('orderId') orderId: string,
    @Body() dto: RequestRefundDto,
    @Req() req: any,
  ) {
    return this.refundService.adminInitiateRefund(orderId, req.user.email, dto);
  }

  /**
   * Admin: Process refund (trigger PayU)
   * POST /refunds/admin/:refundId/process
   */
  @Post('admin/:refundId/process')
  @UseGuards(AdminJwtGuard)
  async processRefund(@Param('refundId') refundId: string, @Req() req: any) {
    return this.refundService.triggerPayURefund(refundId, req.user.email);
  }

  /**
   * Admin: Complete refund manually
   * POST /refunds/admin/:refundId/complete
   */
  @Post('admin/:refundId/complete')
  @UseGuards(AdminJwtGuard)
  async completeRefund(
    @Param('refundId') refundId: string,
    @Body('transactionId') transactionId: string,
    @Req() req: any,
  ) {
    return this.refundService.confirmRefundSuccess(
      refundId,
      req.user.email,
      transactionId,
    );
  }

  /**
   * Admin: Reject refund
   * POST /refunds/admin/:refundId/reject
   */
  @Post('admin/:refundId/reject')
  @UseGuards(AdminJwtGuard)
  async rejectRefund(
    @Param('refundId') refundId: string,
    @Body('reason') reason: string,
    @Req() req: any,
  ) {
    return this.refundService.rejectRefund(refundId, req.user.email, reason);
  }

  // ── Legacy endpoints (kept for backward compat, require user JWT + ADMIN role) ──

  /**
   * @deprecated Use /refunds/admin/all instead
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAllRefundsLegacy(@Query('status') status?: RefundStatus) {
    return this.refundService.getAllRefunds(status);
  }

  /**
   * @deprecated Use /refunds/admin/:refundId/process instead
   */
  @Post(':refundId/process')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async processRefundLegacy(@Param('refundId') refundId: string, @Req() req: any) {
    return this.refundService.triggerPayURefund(refundId, req.user.user_id);
  }

  /**
   * @deprecated Use /refunds/admin/:refundId/complete instead
   */
  @Post(':refundId/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async completeRefundLegacy(
    @Param('refundId') refundId: string,
    @Body('transactionId') transactionId: string,
    @Req() req: any,
  ) {
    return this.refundService.confirmRefundSuccess(
      refundId,
      req.user.user_id,
      transactionId,
    );
  }

  /**
   * @deprecated Use /refunds/admin/:refundId/reject instead
   */
  @Post(':refundId/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async rejectRefundLegacy(
    @Param('refundId') refundId: string,
    @Body('reason') reason: string,
    @Req() req: any,
  ) {
    return this.refundService.rejectRefund(refundId, req.user.user_id, reason);
  }

  // ── PayU Refund Webhook (NO AUTH — PayU calls directly) ──────────────────

  /**
   * POST /refunds/webhook/payu
   * PayU sends refund status updates here.
   * No JWT guard — signature/hash verification happens inside the service.
   */
  @Post('webhook/payu')
  async handlePayURefundWebhook(@Body() body: Record<string, unknown>) {
    return this.refundService.handlePayURefundWebhook(body);
  }
}
