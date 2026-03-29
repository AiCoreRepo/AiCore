import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { PayoutService } from './payout.service';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { AdminJwtGuard } from '../auth/admin/guards/admin-jwt.guard';

@Controller('admin')
@UseGuards(AdminJwtGuard)
export class AdminAnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly payoutService: PayoutService,
  ) {}

  @Get('analytics/overview')
  async getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('analytics/creators')
  async getCreatorsAnalytics() {
    return this.analyticsService.getCreatorsAnalytics();
  }

  @Get('analytics/creator/:id')
  async getCreatorDetails(@Param('id') id: string) {
    return this.analyticsService.getCreatorDetails(id);
  }

  @Post('payouts')
  async createPayout(@Body() body: CreatePayoutDto) {
    return this.payoutService.createPayout(body.creatorId, body.amount, body.note);
  }
}
