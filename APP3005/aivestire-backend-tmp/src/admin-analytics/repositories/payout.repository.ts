// ============================================
// PAYOUT REPOSITORY
// ============================================
// Single point of truth for all payout-related DB access.
// Service layer must NEVER call PrismaService directly for payout operations.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PayoutStatus, PayoutType, Prisma } from '@prisma/client';
import { InitiatePayoutDto } from '../dto/initiate-payout.dto';

export interface CreatePayoutInput {
  creatorId: string;
  amount: number;
  payoutType: PayoutType;
  upiId: string;
  phoneNumber: string;
  processedByAdmin: string;
  note?: string;
}

export interface CreateManualPayoutInput {
  creatorId: string;
  amount: number;
  payoutType: PayoutType;
  status: PayoutStatus;
  processedByAdmin: string;
  paymentGateway?: string;
  transactionId?: string;
  gatewayStatus?: string;
  completedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  note?: string;
}

export interface UpdatePayoutStatusInput {
  status: PayoutStatus;
  gatewayStatus?: string;
  transactionId?: string;
  completedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
}

@Injectable()
export class PayoutRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Create ──────────────────────────────────────────────────────────────

  /**
   * Creates a payout row in PENDING state.
   * Accepts an optional Prisma transaction client for atomicity.
   */
  async createPendingPayout(
    data: CreatePayoutInput,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    return db.payout.create({
      data: {
        creator_id: data.creatorId,
        amount: data.amount,
        payout_type: data.payoutType,
        status: PayoutStatus.PENDING,
        upi_id: data.upiId,
        phone_number: data.phoneNumber,
        processed_by_admin: data.processedByAdmin,
        note: data.note,
      },
    });
  }

  /**
   * Creates a payout row with admin-provided status for manual ledger entries.
   */
  async createManualPayout(
    data: CreateManualPayoutInput,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    return db.payout.create({
      data: {
        creator_id: data.creatorId,
        amount: data.amount,
        payout_type: data.payoutType,
        status: data.status,
        payment_gateway: data.paymentGateway ?? 'MANUAL',
        processed_by_admin: data.processedByAdmin,
        note: data.note,
        ...(data.transactionId && { transaction_id: data.transactionId }),
        ...(data.gatewayStatus && { gateway_status: data.gatewayStatus }),
        ...(data.completedAt && { completed_at: data.completedAt }),
        ...(data.failedAt && { failed_at: data.failedAt }),
        ...(data.failureReason && { failure_reason: data.failureReason }),
      },
    });
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  /**
   * Patches payout status and gateway fields atomically.
   */
  async updatePayoutStatus(
    payoutId: string,
    patch: UpdatePayoutStatusInput,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    return db.payout.update({
      where: { payout_id: payoutId },
      data: {
        status: patch.status,
        ...(patch.gatewayStatus   && { gateway_status:  patch.gatewayStatus }),
        ...(patch.transactionId   && { transaction_id:  patch.transactionId }),
        ...(patch.completedAt     && { completed_at:    patch.completedAt }),
        ...(patch.failedAt        && { failed_at:       patch.failedAt }),
        ...(patch.failureReason   && { failure_reason:  patch.failureReason }),
      },
    });
  }

  // ─── Queries ─────────────────────────────────────────────────────────────

  async getPayoutById(payoutId: string) {
    return this.prisma.payout.findUnique({
      where: { payout_id: payoutId },
    });
  }

  /**
   * Finds a payout by its PayU transaction ID (used during callback handling).
   */
  async getPayoutByTransactionId(transactionId: string) {
    return this.prisma.payout.findFirst({
      where: { transaction_id: transactionId },
    });
  }

  /**
   * Paginated payout history for a creator.
   */
  async getPayoutHistory(creatorId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [payouts, total] = await Promise.all([
      this.prisma.payout.findMany({
        where: { creator_id: creatorId },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payout.count({ where: { creator_id: creatorId } }),
    ]);
    return { payouts, total };
  }

  /**
   * Returns the sum of all SUCCESS payouts for a creator.
   * Accepts an optional Prisma transaction client.
   */
  async getCreatorTotalPaid(creatorId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    const result = await db.payout.aggregate({
      _sum: { amount: true },
      where: {
        creator_id: creatorId,
        status: PayoutStatus.SUCCESS,
      },
    });
    return result._sum.amount;
  }

  /**
   * Returns last payout date (SUCCESS only) for a creator.
   */
  async getLastPayoutDate(creatorId: string): Promise<Date | null> {
    const last = await this.prisma.payout.findFirst({
      where: { creator_id: creatorId, status: PayoutStatus.SUCCESS },
      orderBy: { completed_at: 'desc' },
      select: { completed_at: true },
    });
    return last?.completed_at ?? null;
  }

  /**
   * Fetch summarized payout totals grouped by creator (for analytics tables).
   * Only counts SUCCESS payouts.
   */
  async getPayoutSummaries(creatorIds?: string[]) {
    return this.prisma.payout.groupBy({
      by: ['creator_id'],
      _sum: { amount: true },
      _max: { completed_at: true },
      where: {
        status: PayoutStatus.SUCCESS,
        ...(creatorIds?.length ? { creator_id: { in: creatorIds } } : {}),
      },
    });
  }

  // ─── Legacy compatibility ─────────────────────────────────────────────────

  /**
   * @deprecated Use createPendingPayout() + lifecycle methods instead.
   * Kept for backward compat until all call sites are migrated.
   */
  async createPayoutEntry(
    creatorId: string,
    amount: number,
    note?: string,
    status: PayoutStatus = PayoutStatus.SUCCESS,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    return db.payout.create({
      data: { creator_id: creatorId, amount, note, status },
    });
  }
}
