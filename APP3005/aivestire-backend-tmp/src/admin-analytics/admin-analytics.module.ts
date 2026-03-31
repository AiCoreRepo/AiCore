import { Module } from '@nestjs/common';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { PayoutRepository } from './repositories/payout.repository';
import { AnalyticsService } from './analytics.service';
import { PayoutService } from './payout.service';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    PrismaModule,
    PaymentModule, // Provides PayUGatewayService for hash generation & verification
  ],
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
