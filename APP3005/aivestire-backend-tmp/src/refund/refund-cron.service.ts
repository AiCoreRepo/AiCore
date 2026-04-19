// ============================================
// REFUND CRON SERVICE
// ============================================
//
// Background job that checks for refunds stuck in PROCESSING.
// Runs every 5 minutes via @nestjs/schedule.
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RefundService } from './refund.service';
import { REFUND_CRON_CONFIG } from './constants/refund.constants';

@Injectable()
export class RefundCronService {
  private readonly logger = new Logger(RefundCronService.name);

  constructor(private readonly refundService: RefundService) { }

  /**
   * Every 5 minutes, check for refunds stuck in PROCESSING
   * longer than REFUND_CRON_CONFIG.STALE_THRESHOLD_MINUTES.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleStuckRefunds() {
    this.logger.log('Cron: Checking for stuck PROCESSING refunds...');
    try {
      const resolved = await this.refundService.checkStuckRefunds(
        REFUND_CRON_CONFIG.STALE_THRESHOLD_MINUTES,
      );
      if (resolved > 0) {
        this.logger.warn(`Cron: Resolved ${resolved} stuck refund(s)`);
      } else {
        this.logger.debug('Cron: No stuck refunds found');
      }
    } catch (err) {
      this.logger.error(`Cron: Error checking stuck refunds: ${err}`);
    }
  }
}
