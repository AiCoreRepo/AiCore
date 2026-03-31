// ============================================
// PAYOUT SERVICE — Admin Creator Payout Orchestration
// ============================================
// Reuses PayUGatewayService for hash generation + verification.
// Zero impact on the existing user checkout flow (src/payment/).

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayoutRepository } from './repositories/payout.repository';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { PayUGatewayService } from '../payment/services/payu-gateway.service';
import { ConfigService } from '@nestjs/config';
import { InitiatePayoutDto } from './dto/initiate-payout.dto';
import { ManualPayoutEntryDto } from './dto/manual-payout-entry.dto';
import { PayoutStatusEnum, PayoutTypeEnum } from './enums/payout.enums';
import { PAYOUT_MESSAGES, PAYOUT_TXN_PREFIX } from './constants/payout.constants';
import { VALID_ANALYTICS_ORDER_STATUSES } from './constants/analytics.constants';
import { calculatePendingBalance, toNumber } from './utils/analytics.utils';
import { PayoutStatus, PayoutType, OrderStatus } from '@prisma/client';

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);

  constructor(
    private readonly payoutRepo: PayoutRepository,
    private readonly analyticsRepo: AnalyticsRepository,
    private readonly payuGateway: PayUGatewayService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Initiate Payout ──────────────────────────────────────────────────────

  /**
   * Admin initiates a creator payout.
   *
   * Flow:
   *  1. Validate amount ≤ pending balance (inside DB transaction to avoid races)
   *  2. Create PENDING payout row
   *  3. Build PayU payload and call payout API
   *  4. Update row to PROCESSING
   *  5. Return payout row + PayU payload
   */
  async initiatePayout(dto: InitiatePayoutDto, adminId: string) {
    this.logger.log(`Admin ${adminId} initiating payout for creator ${dto.creatorId}`);

    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch total earnings (VALID order items only)
      const earningsAgg = await tx.orderItem.aggregate({
        _sum: { creator_price: true },
        where: {
          creator_id: dto.creatorId,
          order: {
            current_status: { in: VALID_ANALYTICS_ORDER_STATUSES },
          },
        },
      });
      const totalEarnings = toNumber(earningsAgg._sum.creator_price);

      // 2. Fetch total already paid (SUCCESS payouts only)
      const totalPaid = toNumber(
        await this.payoutRepo.getCreatorTotalPaid(dto.creatorId, tx),
      );

      // 3. Compute pending balance and validate
      const pendingBalance = calculatePendingBalance(totalEarnings, totalPaid);

      if (dto.amount <= 0) {
        throw new BadRequestException(PAYOUT_MESSAGES.INVALID_AMOUNT);
      }
      if (dto.amount > pendingBalance) {
        throw new BadRequestException(
          `${PAYOUT_MESSAGES.INSUFFICIENT} Requested: ₹${dto.amount}, Available: ₹${pendingBalance}`,
        );
      }

      // 4. Create PENDING row (inside the same transaction)
      const payout = await this.payoutRepo.createPendingPayout(
        {
          creatorId:        dto.creatorId,
          amount:           dto.amount,
          payoutType:       dto.payoutType as unknown as PayoutType,
          upiId:            dto.upiId,
          phoneNumber:      dto.phoneNumber,
          processedByAdmin: adminId,
          note:             dto.note,
        },
        tx,
      );

      this.logger.log(`PENDING payout row created: ${payout.payout_id}`);
      return payout;
    }).then(async (payout) => {
      // 5. Attempt PayU Payout dispatch (outside the DB transaction so a gateway error
      //    does NOT roll back the PENDING row — we keep the row and mark it FAILED).
      try {
        const txnId = this.buildPayoutTxnId(payout.payout_id);
        const payoutResult = await this.dispatchPayUPayout({
          txnId,
          amount: dto.amount,
          upiId: dto.upiId,
          phoneNumber: dto.phoneNumber,
          creatorId: dto.creatorId,
          payoutId: payout.payout_id,
        });

        // 6. Update row to PROCESSING with the generated txnId
        const updated = await this.payoutRepo.updatePayoutStatus(payout.payout_id, {
          status:        PayoutStatus.PROCESSING,
          transactionId: txnId,
          gatewayStatus: 'processing',
        });

        this.logger.log(`Payout PROCESSING — payout_id: ${payout.payout_id}, txnId: ${txnId}`);
        return { payout: updated, gateway: payoutResult };
      } catch (err: unknown) {
        const reason = err instanceof Error ? err.message : 'Gateway dispatch failed';
        // Mark as FAILED immediately if we can't even reach PayU
        await this.payoutRepo.updatePayoutStatus(payout.payout_id, {
          status:        PayoutStatus.FAILED,
          failedAt:      new Date(),
          failureReason: reason,
        });
        this.logger.error(`Payout FAILED at dispatch — payout_id: ${payout.payout_id}, reason: ${reason}`);
        throw new BadRequestException(`Payout dispatch failed: ${reason}`);
      }
    });
  }

  /**
   * Admin adds a manual payout entry (outside PayU dispatch flow).
   * This is used for reconciliation when transfer happened externally.
   */
  async createManualPayoutEntry(dto: ManualPayoutEntryDto, adminId: string) {
    this.logger.log(`Admin ${adminId} creating manual payout for creator ${dto.creatorId}`);

    return this.prisma.$transaction(async (tx) => {
      const creator = await tx.creator.findUnique({
        where: { creator_id: dto.creatorId },
        select: { creator_id: true },
      });

      if (!creator) {
        throw new NotFoundException(PAYOUT_MESSAGES.CREATOR_NOT_FOUND);
      }

      const earningsAgg = await tx.orderItem.aggregate({
        _sum: { creator_price: true },
        where: {
          creator_id: dto.creatorId,
          order: {
            current_status: { in: VALID_ANALYTICS_ORDER_STATUSES },
          },
        },
      });

      const totalEarnings = toNumber(earningsAgg._sum.creator_price);
      const totalPaid = toNumber(
        await this.payoutRepo.getCreatorTotalPaid(dto.creatorId, tx),
      );
      const pendingBalance = calculatePendingBalance(totalEarnings, totalPaid);

      if (dto.amount <= 0) {
        throw new BadRequestException(PAYOUT_MESSAGES.INVALID_AMOUNT);
      }

      if (dto.amount > pendingBalance) {
        throw new BadRequestException(
          `${PAYOUT_MESSAGES.INSUFFICIENT} Requested: ₹${dto.amount}, Available: ₹${pendingBalance}`,
        );
      }

      const status = dto.status as unknown as PayoutStatus;
      const payoutType = (dto.payoutType ?? PayoutTypeEnum.PARTIAL) as unknown as PayoutType;
      const now = new Date();
      const remarks = dto.remarks?.trim();

      return this.payoutRepo.createManualPayout(
        {
          creatorId: dto.creatorId,
          amount: dto.amount,
          payoutType,
          status,
          processedByAdmin: adminId,
          paymentGateway: 'MANUAL',
          gatewayStatus: 'manual',
          transactionId: status === PayoutStatus.SUCCESS ? this.buildManualTxnId(dto.creatorId) : undefined,
          completedAt: status === PayoutStatus.SUCCESS ? now : undefined,
          failedAt: status === PayoutStatus.FAILED ? now : undefined,
          failureReason: status === PayoutStatus.FAILED
            ? (remarks || 'Marked failed by admin')
            : undefined,
          note: remarks,
        },
        tx,
      );
    });
  }

  // ─── Gateway Callback ────────────────────────────────────────────────────

  /**
   * Handles PayU's asynchronous payout webhook / callback.
   *
   * SECURITY: Verifies PayU hash before any DB mutation.
   * IDEMPOTENCY: If payout is already SUCCESS, returns early without re-processing.
   */
  async handlePayoutCallback(body: Record<string, string>) {
    const { txnid, status, mihpayid, hash, amount, productinfo, firstname, email, error_Message } = body;

    this.logger.log(`Payout callback received for txnId: ${txnid}, status: ${status}`);

    // 1. Verify hash
    const isHashValid = this.payuGateway.verifyResponseHash(
      { txnid, amount, productinfo, firstname, email, status },
      hash,
    );
    if (!isHashValid) {
      this.logger.warn(`Invalid hash on payout callback for txnid: ${txnid}`);
      throw new BadRequestException(PAYOUT_MESSAGES.HASH_INVALID);
    }

    // 2. Find payout by transaction ID
    const payout = await this.payoutRepo.getPayoutByTransactionId(txnid);
    if (!payout) {
      throw new NotFoundException(PAYOUT_MESSAGES.PAYOUT_NOT_FOUND);
    }

    // 3. Idempotency guard
    if (payout.status === PayoutStatus.SUCCESS) {
      this.logger.warn(`Duplicate callback for already-SUCCESS payout ${payout.payout_id}. Skipping.`);
      return { success: true, message: 'Already processed' };
    }

    // 4. Transition status
    const normalizedStatus = status?.toLowerCase();
    if (normalizedStatus === 'success') {
      await this.payoutRepo.updatePayoutStatus(payout.payout_id, {
        status:        PayoutStatus.SUCCESS,
        gatewayStatus: 'success',
        transactionId: mihpayid ?? txnid,
        completedAt:   new Date(),
      });
      this.logger.log(`Payout SUCCESS — payout_id: ${payout.payout_id}`);
      return { success: true, message: 'Payout marked SUCCESS' };
    } else {
      const reason = error_Message ?? `PayU status: ${status}`;
      await this.payoutRepo.updatePayoutStatus(payout.payout_id, {
        status:        PayoutStatus.FAILED,
        gatewayStatus: normalizedStatus,
        failedAt:      new Date(),
        failureReason: reason,
      });
      this.logger.warn(`Payout FAILED via callback — payout_id: ${payout.payout_id}, reason: ${reason}`);
      return { success: false, message: 'Payout marked FAILED' };
    }
  }

  // ─── Cancel Payout ────────────────────────────────────────────────────────

  /**
   * Admin cancels a PENDING payout before it's dispatched.
   * Cannot cancel PROCESSING or later states.
   */
  async cancelPayout(payoutId: string) {
    const payout = await this.payoutRepo.getPayoutById(payoutId);
    if (!payout) throw new NotFoundException(PAYOUT_MESSAGES.PAYOUT_NOT_FOUND);

    if (payout.status !== PayoutStatus.PENDING) {
      throw new ConflictException(
        `Cannot cancel a payout in ${payout.status} state. Only PENDING payouts can be cancelled.`,
      );
    }

    return this.payoutRepo.updatePayoutStatus(payoutId, {
      status: PayoutStatus.CANCELLED,
    });
  }

  // ─── Creator Summary ──────────────────────────────────────────────────────

  /**
   * Returns financial summary for a creator: earnings, paid, pending balance, history.
   */
  async getCreatorPayoutSummary(creatorId: string, page = 1, limit = 20) {
    const [earningsAgg, totalPaidRaw, { payouts, total }, lastPayoutDate] = await Promise.all([
      this.prisma.orderItem.aggregate({
        _sum: { creator_price: true },
        where: {
          creator_id: creatorId,
          order: {
            current_status: { in: VALID_ANALYTICS_ORDER_STATUSES },
          },
        },
      }),
      this.payoutRepo.getCreatorTotalPaid(creatorId),
      this.payoutRepo.getPayoutHistory(creatorId, page, limit),
      this.payoutRepo.getLastPayoutDate(creatorId),
    ]);

    const totalEarnings  = toNumber(earningsAgg._sum.creator_price);
    const totalPaid      = toNumber(totalPaidRaw);
    const pendingBalance = calculatePendingBalance(totalEarnings, totalPaid);

    return {
      creator_id:       creatorId,
      total_earnings:   totalEarnings,
      total_paid:       totalPaid,
      pending_balance:  pendingBalance,
      last_payout_date: lastPayoutDate,
      payouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  // ─── Utilities ────────────────────────────────────────────────────────────

  /**
   * Builds a unique payout transaction ID for PayU.
   * Format: PAY_<8-char-payout-short-id>_<8-digit-timestamp>
   */
  private buildPayoutTxnId(payoutId: string): string {
    const shortId = payoutId.replace(/-/g, '').slice(0, 8).toUpperCase();
    const timestamp = Date.now().toString().slice(-8);
    return `${PAYOUT_TXN_PREFIX}${shortId}_${timestamp}`;
  }

  /**
   * Builds a transaction id for manual ledger entries.
   */
  private buildManualTxnId(creatorId: string): string {
    const shortId = creatorId.replace(/-/g, '').slice(0, 8).toUpperCase();
    const timestamp = Date.now().toString().slice(-8);
    return `MANUAL_${shortId}_${timestamp}`;
  }

  /**
   * Dispatches the payout via PayU Payouts API.
   *
   * NOTE: PayU Payouts (outbound disbursement) uses a SEPARATE API from
   * PayU Checkout (inbound payments). The hash/key/salt are reused via
   * PayUGatewayService, but the endpoint and payload differ.
   *
   * If you only have PayU Checkout credentials, this will log a warning and
   * return a simulated response — the payout row stays PROCESSING until
   * a manual callback is sent.
   */
  private async dispatchPayUPayout(params: {
    txnId: string;
    amount: number;
    upiId: string;
    phoneNumber: string;
    creatorId: string;
    payoutId: string;
  }): Promise<{ txnId: string; status: string }> {
    // Build the forward hash using existing PayUGatewayService.
    // For PayU Payouts API, hash = SHA512(key|amount|txnid|SALT)
    // We reuse generateHash() which computes the full forward hash.
    const payoutHash = this.payuGateway.generateHash({
      txnid:       params.txnId,
      amount:      params.amount.toFixed(2),
      productinfo: `Creator Payout ${params.creatorId}`,
      firstname:   'Creator',
      email:       `creator-${params.creatorId}@internal.aivestire.com`,
      udf1:        params.payoutId,
    });

    this.logger.log(
      `PayU payout hash generated for txnId: ${params.txnId}. ` +
      `UPI: ${params.upiId}, Amount: ${params.amount}`,
    );

    // TODO: Replace this stub with the real PayU Payouts API HTTP call when
    // your PayU account has the Payout/Disburse product enabled.
    // Example endpoint: POST https://uatdashboard.payu.in/payout/api/v1/transfer
    //
    // For now, returning a resolved promise so the payout row moves to PROCESSING.
    // The admin must use the PayU dashboard or trigger a callback via Postman to
    // simulate the SUCCESS/FAILED transition.
    return {
      txnId:  params.txnId,
      status: 'processing',
    };
  }
}
