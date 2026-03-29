import { Module } from '@nestjs/common';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { PayoutRepository } from './repositories/payout.repository';
import { AnalyticsService } from './analytics.service';
import { PayoutService } from './payout.service';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminAnalyticsController],
  providers: [
    AnalyticsRepository,
    PayoutRepository,
    AnalyticsService,
    PayoutService,
  ],
  exports: [AnalyticsService, PayoutService],
})
export class AdminAnalyticsModule {}
