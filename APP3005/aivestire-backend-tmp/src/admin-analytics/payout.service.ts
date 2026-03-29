import { Injectable, BadRequestException } from '@nestjs/common';
import { PayoutRepository } from './repositories/payout.repository';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { PrismaService } from '../prisma/prisma.service';
import {
  calculateCreatorAnalytics,
  calculatePendingBalance,
  payoutValidation,
  toNumber,
} from './utils/analytics.utils';
import { PayoutStatus } from '@prisma/client';

@Injectable()
export class PayoutService {
  constructor(
    private readonly payoutRepo: PayoutRepository,
    private readonly analyticsRepo: AnalyticsRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Validates and creates a payout securely using Prisma transactions
   */
  async createPayout(creatorId: string, amount: number, note?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Payout amount must be positive.');
    }

    // $transaction ensures we lock or securely atomicize checking balances and updating
    // Note: To completely avoid concurrency anomalies, we should ideally use PostgreSQL advisory locks 
    // or SELECT FOR UPDATE if there was a balance row. Since balance is derived from aggregate, 
    // Prisma transaction ensures statements run isolation Level rules.
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch aggregated earnings for author using transaction
      const earningsStats = await tx.orderItem.aggregate({
        _sum: {
          creator_price: true,
        },
        where: {
          creator_id: creatorId,
          order_status: 'DELIVERED', // matching DELIVERED_STATUS constant
        },
      });

      const totalEarnings = toNumber(earningsStats._sum.creator_price);

      // 2. Fetch total payouts
      const totalPaid = await this.payoutRepo.getCreatorTotalPaid(creatorId, tx);

      // 3. Calculate pending
      const pendingBalance = calculatePendingBalance(totalEarnings, toNumber(totalPaid));

      // 4. Validate
      try {
        payoutValidation(amount, pendingBalance);
      } catch (err: any) {
        throw new BadRequestException(err.message);
      }

      // 5. Create payout inside transaction
      return this.payoutRepo.createPayoutEntry(
        creatorId,
        amount,
        note,
        PayoutStatus.COMPLETED,
        tx,
      );
    });
  }
}
