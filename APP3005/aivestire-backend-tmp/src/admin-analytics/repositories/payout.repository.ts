import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PayoutStatus, Prisma } from '@prisma/client';

@Injectable()
export class PayoutRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch summarized payout totals grouped by creator
   */
  async getPayoutSummaries(creatorIds?: string[]) {
    return this.prisma.payout.groupBy({
      by: ['creator_id'],
      _sum: {
        amount: true,
      },
      _max: {
        created_at: true,
      },
      where: {
        status: PayoutStatus.COMPLETED,
        ...(creatorIds?.length ? { creator_id: { in: creatorIds } } : {}),
      },
    });
  }

  /**
   * Fetch individual payout sum for a specific creator
   */
  async getCreatorTotalPaid(creatorId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    const result = await db.payout.aggregate({
      _sum: { amount: true },
      where: {
        creator_id: creatorId,
        status: PayoutStatus.COMPLETED,
      },
    });
    return result._sum.amount;
  }

  /**
   * Fetch complete payout history for a creator
   */
  async getPayoutHistory(creatorId: string) {
    return this.prisma.payout.findMany({
      where: { creator_id: creatorId },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Create a payout entry.
   * Can accept an optional Prisma transaction client to ensure ACID properties 
   * over concurrent payout requests.
   */
  async createPayoutEntry(
    creatorId: string,
    amount: number,
    note?: string,
    status: PayoutStatus = PayoutStatus.COMPLETED,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    return db.payout.create({
      data: {
        creator_id: creatorId,
        amount,
        note,
        status,
      },
    });
  }
}
