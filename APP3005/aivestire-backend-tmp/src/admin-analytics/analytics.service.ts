import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { PayoutRepository } from './repositories/payout.repository';
import {
  calculateCreatorAnalytics,
  calculatePendingBalance,
  CreatorFinancialSummary,
  toNumber,
} from './utils/analytics.utils';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly analyticsRepo: AnalyticsRepository,
    private readonly payoutRepo: PayoutRepository,
  ) {}

  /**
   * Returns global metrics across all creators
   */
  async getOverview() {
    const [globalStats, payoutsList] = await Promise.all([
      this.analyticsRepo.aggregateGlobalMetrics(),
      this.payoutRepo.getPayoutSummaries(),
    ]);

    // Aggregate all payouts from the list
    const totalPaid = payoutsList.reduce((sum, p) => sum + toNumber(p._sum.amount), 0);
    const earnings = calculateCreatorAnalytics(globalStats);

    return {
      ...earnings,
      total_paid: totalPaid,
      pending_balance: calculatePendingBalance(earnings.creator_earnings, totalPaid),
    };
  }

  /**
   * Returns a list of creators with their respective financial standings
   */
  async getCreatorsAnalytics() {
    const [creatorStats, creatorPayouts] = await Promise.all([
      this.analyticsRepo.aggregateCreatorMetrics(),
      this.payoutRepo.getPayoutSummaries(),
    ]);

    const payoutMap = new Map<string, { total_paid: number; last_payout_date: Date | null }>();
    for (const p of creatorPayouts) {
      payoutMap.set(p.creator_id, {
        total_paid: toNumber(p._sum.amount),
        last_payout_date: p._max.completed_at,
      });
    }

    const results: (CreatorFinancialSummary & { creator_id: string })[] = creatorStats.map((stat) => {
      const payoutData = payoutMap.get(stat.creator_id) || { total_paid: 0, last_payout_date: null };
      const earnings = calculateCreatorAnalytics(stat);

      return {
        creator_id: stat.creator_id,
        ...earnings,
        total_paid: payoutData.total_paid,
        pending_balance: calculatePendingBalance(earnings.creator_earnings, payoutData.total_paid),
        last_payout_date: payoutData.last_payout_date,
      };
    });

    return results;
  }

  /**
   * Returns detailed analytics including product breakdown for a specific creator
   */
  async getCreatorDetails(creatorId: string) {
    const [summaryList, totalPaidRaw, breakdown, payoutHistory] = await Promise.all([
      this.analyticsRepo.aggregateCreatorMetrics([creatorId]),
      this.payoutRepo.getCreatorTotalPaid(creatorId),
      this.analyticsRepo.getCreatorProductBreakdown(creatorId),
      this.payoutRepo.getPayoutHistory(creatorId, 1, 20),
    ]);

    const summary = summaryList.length > 0 ? summaryList[0] : null;
    const earnings = calculateCreatorAnalytics(summary);
    const totalPaid = toNumber(totalPaidRaw);

    return {
      summary: {
        ...earnings,
        total_paid: totalPaid,
        pending_balance: calculatePendingBalance(earnings.creator_earnings, totalPaid),
      },
      product_breakdown: breakdown.map((b) => ({
        product_id: b.product_id,
        product_name: b.product_name,
        ...calculateCreatorAnalytics(b),
      })),
      payout_history: payoutHistory.payouts,
    };
  }
}
