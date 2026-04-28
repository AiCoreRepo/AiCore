// ============================================
// ADMIN ANALYTICS CONTROLLER
// ============================================

import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, Request, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { PayoutService } from './payout.service';
import { InitiatePayoutDto } from './dto/initiate-payout.dto';
import { ManualPayoutEntryDto } from './dto/manual-payout-entry.dto';
import { AdminJwtGuard } from '../auth/admin/guards/admin-jwt.guard';

@Controller('admin')
export class AdminAnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly payoutService: PayoutService,
  ) {}

  // ─── Analytics ────────────────────────────────────────────────────────────

  @Get('analytics/overview')
  @UseGuards(AdminJwtGuard)
  async getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('analytics/creators')
  @UseGuards(AdminJwtGuard)
  async getCreatorsAnalytics() {
    return this.analyticsService.getCreatorsAnalytics();
  }

  @Get('analytics/creator/:id')
  @UseGuards(AdminJwtGuard)
  async getCreatorAnalyticsDetails(@Param('id') id: string) {
    return this.analyticsService.getCreatorDetails(id);
  }

  // ─── Payout: Initiate ─────────────────────────────────────────────────────

  /**
   * POST /admin/payouts/initiate
   * Admin initiates a creator payout via PayU.
   * Creates a PENDING payout row then immediately moves to PROCESSING after dispatch.
   */
  @Post('payouts/initiate')
  @UseGuards(AdminJwtGuard)
  async initiatePayout(
    @Request() req: { user: { user_id: string } },
    @Body() dto: InitiatePayoutDto,
  ) {
    return this.payoutService.initiatePayout(dto, req.user.user_id);
  }

  /**
   * POST /admin/payouts/manual-entry
   * Admin creates a manual payout ledger entry with explicit status.
   */
  @Post('payouts/manual-entry')
  @UseGuards(AdminJwtGuard)
  async createManualPayoutEntry(
    @Request() req: { user: { user_id: string } },
    @Body() dto: ManualPayoutEntryDto,
  ) {
    return this.payoutService.createManualPayoutEntry(dto, req.user.user_id);
  }

  // ─── Payout: Gateway Callback ─────────────────────────────────────────────

  /**
   * POST /admin/payouts/callback
   * PayU calls this endpoint asynchronously after processing the payout.
   * NO JWT guard — PayU posts this directly.
   * Hash verification is done INSIDE the service before any DB mutation.
   */
  @Post('payouts/callback')
  async handlePayoutCallback(@Body() body: Record<string, string>) {
    return this.payoutService.handlePayoutCallback(body);
  }

  // ─── Payout: Cancel ───────────────────────────────────────────────────────

  /**
   * POST /admin/payouts/:payoutId/cancel
   * Cancels a PENDING payout. Cannot cancel PROCESSING or later states.
   */
  @Post('payouts/:payoutId/cancel')
  @UseGuards(AdminJwtGuard)
  async cancelPayout(@Param('payoutId') payoutId: string) {
    return this.payoutService.cancelPayout(payoutId);
  }

  // ─── Payout: Creator Summary ──────────────────────────────────────────────

  /**
   * GET /admin/payouts/creator/:creatorId
   * Returns total_earnings, total_paid, pending_balance, and paginated payout history.
   */
  @Get('payouts/creator/:creatorId')
  @UseGuards(AdminJwtGuard)
  async getCreatorPayoutSummary(
    @Param('creatorId') creatorId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.payoutService.getCreatorPayoutSummary(creatorId, page, limit);
  }
}
