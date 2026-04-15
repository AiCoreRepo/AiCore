import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { RequestRefundDto } from './dto/request-refund.dto';
import {
  Prisma,
  RefundStatus,
  PaymentStatus,
  PaymentMethod,
  WalletTransactionSource,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@prisma/client';
import { PayUGatewayService } from '../payment/services/payu-gateway.service';
import { OrderRefundInitiatedEvent } from './events/order-refund-initiated.event';
import { OrderRefundCompletedEvent } from './events/order-refund-completed.event';
import { SseService, RefundSsePayload } from '../sse/sse.service';
import {
  REFUND_STATUS_MESSAGES,
  PAYU_REFUND_STATUS_MAP,
  REFUND_TERMINAL_STATES,
} from './constants/refund.constants';

// ─── Allowed state transitions ────────────────────────────────────────────────
//
//  PENDING_REVIEW  →  PROCESSING  (admin triggers PayU)
//  PENDING_REVIEW  →  REJECTED    (admin rejects)
//  PENDING_REVIEW  →  ARCHIVED    (admin archives)
//  PROCESSING      →  COMPLETED   (PayU success / manual confirm)
//  PROCESSING      →  FAILED      (PayU failure / manual fail)
//
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class RefundService {
  private readonly logger = new Logger(RefundService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly payuGateway: PayUGatewayService,
    private readonly sseService: SseService,
  ) { }

  // ─── SSE Helper ─────────────────────────────────────────────────────────

  /**
   * Push a refund status update to the order owner via SSE.
   * Safe to call even if the user has no active connections.
   */
  private pushRefundSse(
    userId: string,
    refundId: string,
    orderId: string,
    status: string,
    amount?: string,
  ): void {
    const payload: RefundSsePayload = {
      refundId,
      orderId,
      status,
      message: REFUND_STATUS_MESSAGES[status] ?? `Refund status: ${status}`,
      amount,
      timestamp: new Date().toISOString(),
    };
    this.sseService.pushRefundUpdate(userId, payload);
  }

  // ─── 1. User: Initiate refund request ────────────────────────────────────

  /**
   * User initiates refund for a cancelled or return-approved order.
   * Status is set to PENDING_REVIEW — admin must take action.
   */
  async initiateRefund(
    orderId: string,
    userId: string,
    dto?: RequestRefundDto,
  ) {
    this.logger.log(`Initiating refund for order ${orderId}`);

    const order = await this.prisma.order.findUnique({
      where: { order_id: orderId },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (order.user_id !== userId) {
      throw new BadRequestException('Order does not belong to this user');
    }

    if (order.payment_method === PaymentMethod.COD) {
      throw new BadRequestException('Only prepaid orders can be refunded');
    }

    if (order.payment_status === PaymentStatus.REFUNDED) {
      throw new BadRequestException('Order already refunded');
    }

    // Prevent multiple active refund requests
    if (
      order.refund_status === RefundStatus.PENDING_REVIEW ||
      order.refund_status === RefundStatus.INITIATED ||
      order.refund_status === RefundStatus.PROCESSING
    ) {
      throw new ConflictException('A refund request is already in progress');
    }

    // Only cancelled orders or QC-passed returns are eligible
    const isEligible =
      order.current_status === 'CANCELLED' ||
      order.return_status === 'QC_PASSED' ||
      order.return_status === 'COMPLETED';

    if (!isEligible) {
      throw new BadRequestException(
        'Order must be cancelled or have approved return to initiate a refund',
      );
    }

    const refund = await this.prisma.$transaction(async (tx) => {
      const newRefund = await tx.orderRefund.create({
        data: {
          order_id: orderId,
          amount: order.total_amount,
          refund_status: RefundStatus.PENDING_REVIEW,
          refund_reason: dto?.reason,
        },
      });

      await tx.order.update({
        where: { order_id: orderId },
        data: {
          refund_status: RefundStatus.PENDING_REVIEW,
          refund_amount: order.total_amount,
        },
      });

      return newRefund;
    });

    this.logger.log(`Refund created (PENDING_REVIEW): ${refund.refund_id}`);

    this.eventEmitter.emit(
      'order.refund.initiated',
      new OrderRefundInitiatedEvent(order, refund),
    );

    // Push SSE to user
    this.pushRefundSse(
      order.user_id,
      refund.refund_id,
      orderId,
      'PENDING_REVIEW',
      order.total_amount.toFixed(2),
    );

    return refund;
  }

  // ─── 1b. Admin: Initiate refund on behalf of user (no ownership check) ───

  /**
   * Admin initiates a refund directly — skips the user_id ownership check.
   * Status is set to PENDING_REVIEW. Admin can then immediately trigger PayU.
   */
  async adminInitiateRefund(
    orderId: string,
    adminEmail: string,
    dto?: RequestRefundDto,
  ) {
    this.logger.log(`Admin ${adminEmail} initiating refund for order ${orderId}`);

    const order = await this.prisma.order.findUnique({
      where: { order_id: orderId },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (order.payment_method === PaymentMethod.COD) {
      throw new BadRequestException('Only prepaid orders can be refunded');
    }

    if (order.payment_status === PaymentStatus.REFUNDED) {
      throw new BadRequestException('Order already refunded');
    }

    // Check for existing active refund
    const existingRefund = await this.prisma.orderRefund.findFirst({
      where: {
        order_id: orderId,
        refund_status: {
          in: [
            RefundStatus.PENDING_REVIEW,
            RefundStatus.INITIATED,
            RefundStatus.PROCESSING,
          ],
        },
      },
    });

    if (existingRefund) {
      // Return existing refund instead of creating a duplicate
      this.logger.log(`Existing active refund found: ${existingRefund.refund_id}`);
      return existingRefund;
    }

    const refund = await this.prisma.$transaction(async (tx) => {
      const newRefund = await tx.orderRefund.create({
        data: {
          order_id: orderId,
          amount: order.total_amount,
          refund_status: RefundStatus.PENDING_REVIEW,
          refund_reason: dto?.reason ?? `Admin (${adminEmail}) triggered refund`,
        },
      });

      await tx.order.update({
        where: { order_id: orderId },
        data: {
          refund_status: RefundStatus.PENDING_REVIEW,
          refund_amount: order.total_amount,
        },
      });

      return newRefund;
    });

    this.logger.log(`Admin-initiated refund created (PENDING_REVIEW): ${refund.refund_id}`);

    this.eventEmitter.emit(
      'order.refund.initiated',
      new OrderRefundInitiatedEvent(order, refund),
    );

    // Push SSE to user
    this.pushRefundSse(
      order.user_id,
      refund.refund_id,
      orderId,
      'PENDING_REVIEW',
      order.total_amount.toFixed(2),
    );

    return refund;
  }

  // ─── 2. Admin: Trigger PayU refund API ───────────────────────────────────

  /**
   * Admin triggers the PayU refund API call.
   * Guard: status MUST be PENDING_REVIEW (prevents double-refund).
   * Flow:  PENDING_REVIEW → PROCESSING → (COMPLETED | FAILED)
   * Wallet is credited only on success, inside a single Prisma transaction.
   */
  async triggerPayURefund(refundId: string, adminId: string) {
    this.logger.log(`Admin ${adminId} triggering PayU refund for ${refundId}`);

    const refund = await this.prisma.orderRefund.findUnique({
      where: { refund_id: refundId },
      include: {
        order: {
          include: {
            user: { select: { user_id: true, email: true, phone: true } },
            payment_transactions: {
              orderBy: { created_at: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!refund) throw new NotFoundException('Refund not found');

    // ── Duplicate-trigger guard ──────────────────────────────────────────
    // Allow re-triggering from PENDING_REVIEW or FAILED (e.g. after a purged-transaction reset)
    const RETRIGGERABLE_STATES: RefundStatus[] = [RefundStatus.PENDING_REVIEW, RefundStatus.FAILED];
    if (!RETRIGGERABLE_STATES.includes(refund.refund_status)) {
      throw new ConflictException(
        `Cannot trigger PayU refund: current status is ${refund.refund_status}. ` +
        `Only PENDING_REVIEW or FAILED refunds can be triggered.`,
      );
    }

    // Locate the captured PayU transaction
    const paymentTxn = refund.order.payment_transactions[0];
    if (!paymentTxn?.gateway_payment_id) {
      throw new BadRequestException(
        'No valid PayU payment transaction found for this order',
      );
    }

    const adminUuid = adminId.includes('@')
      ? (await this.prisma.user.findUnique({ where: { email: adminId } }))?.user_id
      : adminId;

    // Mark as PROCESSING first (persisted before calling PayU)
    await this.prisma.$transaction(async (tx) => {
      await tx.orderRefund.update({
        where: { refund_id: refundId },
        data: {
          refund_status: RefundStatus.PROCESSING,
          processing_at: new Date(),
          reviewed_by: adminUuid,
          reviewed_at: new Date(),
          approved_by: adminUuid,
          approved_at: new Date(),
        },
      });

      await tx.order.update({
        where: { order_id: refund.order_id },
        data: { refund_status: RefundStatus.PROCESSING },
      });
    });

    this.logger.log(`Refund ${refundId} set to PROCESSING, calling PayU...`);

    // ── Call PayU Refund API (outside Prisma tx due to network I/O) ──────
    let payuResponse: Record<string, unknown>;
    try {
      payuResponse = await this.payuGateway.initiatePayURefund(
        paymentTxn.gateway_payment_id,
        refund.amount.toFixed(2),
        refund.refund_id, // CRITICAL: var2 MUST be a strictly unique token for the REFUND, not the original payment txnid!
      );
    } catch (err: unknown) {
      // Network error — mark FAILED and rethrow
      await this._markFailed(refundId, refund.order_id, 'PayU API network error');
      const msg = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(`PayU API call failed: ${msg}`);
    }

    // PayU returns status 1 for success, 0 for failure
    const isSuccess =
      payuResponse['status'] === 1 ||
      payuResponse['status'] === '1' ||
      String(payuResponse['status']).toLowerCase() === 'success';

    if (isSuccess) {
      const payuRefundId = String(
        payuResponse['refundId'] ?? payuResponse['mihpayid'] ?? '',
      );

      // ── Complete: credit wallet + update all tables in one Prisma tx ──
      const completed = await this._completeRefundInTransaction(
        refundId,
        refund,
        payuRefundId,
        payuResponse,
        adminId,
      );

      this.logger.log(`Refund ${refundId} COMPLETED via PayU`);

      this.eventEmitter.emit(
        'order.refund.completed',
        new OrderRefundCompletedEvent(refund.order, completed),
      );
      console.log("Refund completed: ", completed);
      // Push SSE to user
      this.pushRefundSse(
        refund.order.user_id,
        refundId,
        refund.order_id,
        'COMPLETED',
        refund.amount.toFixed(2),
      );

      return completed;
    } else {
      // PayU returned a failure response
      const failReason =
        String(payuResponse['msg'] ?? payuResponse['message'] ?? 'PayU refund rejected');

      // ── Detect "Purged Transaction" / "manual follow-up" errors ──────────
      // These mean PayU cannot process the refund automatically (txn too old).
      // Reset to PENDING_REVIEW so the admin can issue a manual wallet credit
      // instead of permanently blocking the refund in FAILED state.
      const MANUAL_FOLLOWUP_KEYWORDS = [
        'purged',
        'manual follow-up',
        'manual followup',
        'requires manual',
      ];
      const isManualFollowup = MANUAL_FOLLOWUP_KEYWORDS.some((kw) =>
        failReason.toLowerCase().includes(kw),
      );

      if (isManualFollowup) {
        this.logger.warn(
          `Refund ${refundId}: PayU "Purged Transaction" — resetting to PENDING_REVIEW for manual processing. Reason: ${failReason}`,
        );
        await this._resetToPendingReview(
          refundId,
          refund.order_id,
          `PayU auto-refund unavailable (purged transaction). Manual wallet credit required. PayU msg: ${failReason}`,
          payuResponse,
        );

        this.pushRefundSse(
          refund.order.user_id,
          refundId,
          refund.order_id,
          'PENDING_REVIEW',
          refund.amount.toFixed(2),
        );

        throw new BadRequestException(
          `PayU refund failed: ${failReason} — Refund has been reset to PENDING_REVIEW. Please issue a manual wallet credit from the admin panel.`,
        );
      }

      // Standard failure — mark FAILED
      await this._markFailed(refundId, refund.order_id, failReason, payuResponse);
      this.logger.warn(`Refund ${refundId} FAILED: ${failReason}`);

      this.pushRefundSse(
        refund.order.user_id,
        refundId,
        refund.order_id,
        'FAILED',
        refund.amount.toFixed(2),
      );

      throw new BadRequestException(`PayU refund failed: ${failReason}`);
    }
  }


  // ─── 3. Admin: Manually confirm PayU success (webhook / fallback) ─────────

  /**
   * Manually confirm a PROCESSING refund as successful.
   * Used when PayU sends confirmation via webhook or the admin verifies
   * success through the PayU dashboard.
   */
  async confirmRefundSuccess(
    refundId: string,
    adminId: string,
    payuRefundId?: string,
  ) {
    this.logger.log(`Admin ${adminId} confirming success for refund ${refundId}`);

    const refund = await this.prisma.orderRefund.findUnique({
      where: { refund_id: refundId },
      include: { order: true },
    });

    if (!refund) throw new NotFoundException('Refund not found');

    if (refund.refund_status !== RefundStatus.PROCESSING) {
      throw new ConflictException(
        `Cannot confirm success: current status is ${refund.refund_status}. Expected PROCESSING.`,
      );
    }

    const adminUuid = adminId.includes('@')
      ? (await this.prisma.user.findUnique({ where: { email: adminId } }))?.user_id
      : adminId;

    const completed = await this._completeRefundInTransaction(
      refundId,
      refund as any,
      payuRefundId ?? refund.payu_refund_id ?? '',
      refund.payu_response as Record<string, unknown> | null ?? {},
      adminUuid ?? adminId,
    );

    this.logger.log(`Refund ${refundId} manually confirmed as COMPLETED`);

    this.eventEmitter.emit(
      'order.refund.completed',
      new OrderRefundCompletedEvent(refund.order, completed),
    );

    // Push SSE to user
    this.pushRefundSse(
      refund.order.user_id,
      refundId,
      refund.order_id,
      'COMPLETED',
      refund.amount.toFixed(2),
    );

    return completed;
  }

  // ─── 4. Admin: Mark refund as failed ────────────────────────────────────

  /**
   * Mark a PROCESSING refund as FAILED.
   */
  async failRefund(refundId: string, adminId: string, reason: string) {
    this.logger.log(`Admin ${adminId} marking refund ${refundId} as FAILED`);

    const refund = await this.prisma.orderRefund.findUnique({
      where: { refund_id: refundId },
    });

    if (!refund) throw new NotFoundException('Refund not found');

    if (refund.refund_status !== RefundStatus.PROCESSING) {
      throw new ConflictException(
        `Cannot mark failed: current status is ${refund.refund_status}. Expected PROCESSING.`,
      );
    }

    return this._markFailed(refundId, refund.order_id, reason);
  }

  // ─── 5. Admin: Reject refund ─────────────────────────────────────────────

  /**
   * Admin rejects a PENDING_REVIEW refund.
   * Rejection from PROCESSING is not allowed — use failRefund() instead.
   */
  async rejectRefund(refundId: string, adminId: string, reason: string) {
    this.logger.log(`Admin ${adminId} rejecting refund ${refundId}`);

    const refund = await this.prisma.orderRefund.findUnique({
      where: { refund_id: refundId },
    });

    if (!refund) throw new NotFoundException('Refund not found');

    if (refund.refund_status === RefundStatus.COMPLETED) {
      throw new ConflictException('Cannot reject a completed refund');
    }

    if (refund.refund_status === RefundStatus.ARCHIVED) {
      throw new ConflictException('Cannot reject an archived refund — unarchive first');
    }

    if (refund.refund_status !== RefundStatus.PENDING_REVIEW) {
      throw new ConflictException(
        `Cannot reject: current status is ${refund.refund_status}. Only PENDING_REVIEW refunds can be rejected.`,
      );
    }

    const adminUuid = adminId.includes('@')
      ? (await this.prisma.user.findUnique({ where: { email: adminId } }))?.user_id
      : adminId;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.orderRefund.update({
        where: { refund_id: refundId },
        data: {
          refund_status: RefundStatus.REJECTED,
          rejection_reason: reason,
          reviewed_by: adminUuid,
          reviewed_at: new Date(),
          review_notes: reason,
        },
      });

      await tx.order.update({
        where: { order_id: refund.order_id },
        data: { refund_status: RefundStatus.REJECTED },
      });

      return result;
    });

    this.logger.log(`Refund ${refundId} REJECTED by admin ${adminId}`);

    // Push SSE to order owner
    const rejectedOrder = await this.prisma.order.findUnique({ where: { order_id: refund.order_id }, select: { user_id: true } });
    if (rejectedOrder) {
      this.pushRefundSse(rejectedOrder.user_id, refundId, refund.order_id, 'REJECTED');
    }

    return updated;
  }

  // ─── 6. Admin: Archive refund ────────────────────────────────────────────

  /**
   * Admin archives (snoozes) a PENDING_REVIEW refund.
   * No money moves. Admin can revisit later.
   */
  async archiveRefund(refundId: string, adminId: string, notes?: string) {
    this.logger.log(`Admin ${adminId} archiving refund ${refundId}`);

    const refund = await this.prisma.orderRefund.findUnique({
      where: { refund_id: refundId },
    });

    if (!refund) throw new NotFoundException('Refund not found');

    if (refund.refund_status !== RefundStatus.PENDING_REVIEW) {
      throw new ConflictException(
        `Cannot archive: current status is ${refund.refund_status}. Only PENDING_REVIEW refunds can be archived.`,
      );
    }

    const adminUuid = adminId.includes('@')
      ? (await this.prisma.user.findUnique({ where: { email: adminId } }))?.user_id
      : adminId;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.orderRefund.update({
        where: { refund_id: refundId },
        data: {
          refund_status: RefundStatus.ARCHIVED,
          archived_at: new Date(),
          archived_by: adminUuid,
          review_notes: notes,
          reviewed_by: adminUuid,
          reviewed_at: new Date(),
        },
      });

      await tx.order.update({
        where: { order_id: refund.order_id },
        data: { refund_status: RefundStatus.ARCHIVED },
      });

      return result;
    });

    this.logger.log(`Refund ${refundId} ARCHIVED by admin ${adminId}`);
    return updated;
  }

  // ─── 7. Read methods ──────────────────────────────────────────────────────

  async getRefundStatus(orderId: string) {
    const refund = await this.prisma.orderRefund.findFirst({
      where: { order_id: orderId },
      orderBy: { initiated_at: 'desc' },
    });

    if (!refund) throw new NotFoundException('No refund found for this order');
    return refund;
  }

  async getRefundById(refundId: string) {
    const refund = await this.prisma.orderRefund.findUnique({
      where: { refund_id: refundId },
      include: {
        order: {
          include: {
            user: {
              select: { user_id: true, email: true, phone: true },
            },
            payment_transactions: {
              orderBy: { created_at: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!refund) throw new NotFoundException('Refund not found');
    return refund;
  }

  async getAllRefunds(status?: RefundStatus) {
    return this.prisma.orderRefund.findMany({
      where: status ? { refund_status: status } : undefined,
      include: {
        order: {
          include: {
            user: {
              select: { user_id: true, email: true, phone: true },
            },
          },
        },
      },
      orderBy: { initiated_at: 'desc' },
    });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Completes a refund inside a single Prisma transaction:
   *  - Updates OrderRefund → COMPLETED
   *  - Updates Order → refund_status + payment_status
   *  - Credits user wallet
   *  - Creates wallet transaction record
   */
  private async _completeRefundInTransaction(
    refundId: string,
    refund: {
      order_id: string;
      amount: Prisma.Decimal;
      order: { user_id: string; order_number: string };
    },
    payuRefundId: string,
    payuResponse: Record<string, unknown>,
    adminId: string,
  ) {
    const adminUuid = adminId?.includes('@')
      ? (await this.prisma.user.findUnique({ where: { email: adminId } }))?.user_id
      : adminId;

    return this.prisma.$transaction(async (tx) => {
      // 1. Update refund record
      const updated = await tx.orderRefund.update({
        where: { refund_id: refundId },
        data: {
          refund_status: RefundStatus.COMPLETED,
          completed_at: new Date(),
          payu_refund_id: payuRefundId || undefined,
          payu_response: payuResponse as Prisma.InputJsonValue,
          reviewed_by: adminUuid,
          reviewed_at: new Date(),
        },
      });

      // 2. Update order statuses
      const currentOrder = await tx.order.findUnique({
        where: { order_id: refund.order_id },
        select: { return_status: true, replace_status: true },
      });

      const updateData: Prisma.OrderUpdateInput = {
        refund_status: RefundStatus.COMPLETED,
        payment_status: PaymentStatus.REFUNDED,
      };

      // If an active return or replacement is underway, finalizing the refund completes its lifecycle.
      if (currentOrder?.return_status && currentOrder.return_status !== 'COMPLETED') {
        updateData.return_status = 'COMPLETED';
      }
      if (currentOrder?.replace_status && currentOrder.replace_status !== 'COMPLETED') {
        updateData.replace_status = 'COMPLETED';
      }

      await tx.order.update({
        where: { order_id: refund.order_id },
        data: updateData,
      });

      // 3. Upsert wallet
      const wallet = await tx.wallet.upsert({
        where: { user_id: refund.order.user_id },
        update: {},
        create: {
          user_id: refund.order.user_id,
          balance: new Prisma.Decimal(0),
        },
      });

      const creditedBalance = new Prisma.Decimal(wallet.balance).plus(
        new Prisma.Decimal(refund.amount),
      );

      // 4. Credit wallet balance
      await tx.wallet.update({
        where: { wallet_id: wallet.wallet_id },
        data: { balance: creditedBalance },
      });

      // 5. Record wallet transaction
      await tx.walletTransaction.create({
        data: {
          wallet_id: wallet.wallet_id,
          type: WalletTransactionType.CREDIT,
          source: WalletTransactionSource.REFUND,
          amount: refund.amount,
          reference_id: refundId,
          description: `Refund credited for order ${refund.order.order_number}`,
          status: WalletTransactionStatus.SUCCESS,
        },
      });

      return updated;
    });
  }

  /**
   * Marks a refund FAILED. Used on PayU API failure or admin manual action.
   */
  private async _markFailed(
    refundId: string,
    orderId: string,
    reason: string,
    payuResponse?: Record<string, unknown>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.orderRefund.update({
        where: { refund_id: refundId },
        data: {
          refund_status: RefundStatus.FAILED,
          failed_at: new Date(),
          review_notes: reason,
          ...(payuResponse
            ? { payu_response: payuResponse as Prisma.InputJsonValue }
            : {}),
        },
      });

      await tx.order.update({
        where: { order_id: orderId },
        data: { refund_status: RefundStatus.FAILED },
      });

      return updated;
    });
  }

  /**
   * Resets a refund from PROCESSING back to PENDING_REVIEW.
   * Used when PayU cannot process the refund automatically (e.g. purged transaction)
   * so the admin can issue a manual wallet credit instead.
   */
  private async _resetToPendingReview(
    refundId: string,
    orderId: string,
    reason: string,
    payuResponse?: Record<string, unknown>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.orderRefund.update({
        where: { refund_id: refundId },
        data: {
          refund_status: RefundStatus.PENDING_REVIEW,
          processing_at: null,
          review_notes: reason,
          ...(payuResponse
            ? { payu_response: payuResponse as Prisma.InputJsonValue }
            : {}),
        },
      });

      await tx.order.update({
        where: { order_id: orderId },
        data: { refund_status: RefundStatus.PENDING_REVIEW },
      });

      return updated;
    });
  }

  // ─── 8. PayU Refund Webhook Handler ──────────────────────────────────────

  /**
   * Handles PayU refund webhook callback.
   * This is the SOURCE OF TRUTH for final refund status.
   *
   * Flow:
   *   1. Look up refund by payu_refund_id (or by order's payment txn)
   *   2. Idempotency: skip if already COMPLETED or FAILED
   *   3. Map PayU status → internal status
   *   4. Update DB
   *   5. Push SSE event to user
   */
  async handlePayURefundWebhook(webhookPayload: Record<string, unknown>) {
    this.logger.log(`PayU refund webhook received: ${JSON.stringify(webhookPayload)}`);

    const mihpayid = String(webhookPayload['mihpayid'] ?? '');
    const payuRefundId = String(
      webhookPayload['request_id'] ??
      webhookPayload['bank_ref_num'] ??
      webhookPayload['refundId'] ?? '',
    );
    const payuStatus = String(
      webhookPayload['status'] ?? webhookPayload['refund_status'] ?? '',
    ).toLowerCase();

    if (!mihpayid && !payuRefundId) {
      this.logger.warn('Webhook missing identifiers, ignoring');
      return { processed: false, reason: 'missing_identifiers' };
    }

    // Try to locate the refund by payu_refund_id first, then by payment transaction
    let refund = payuRefundId
      ? await this.prisma.orderRefund.findFirst({
        where: { payu_refund_id: payuRefundId },
        include: { order: { select: { user_id: true, order_number: true } } },
      })
      : null;

    if (!refund && mihpayid) {
      // Fallback: find via payment transaction → order → latest refund
      const txn = await this.prisma.paymentTransaction.findFirst({
        where: { gateway_payment_id: mihpayid },
        select: { order_id: true },
      });
      if (txn) {
        refund = await this.prisma.orderRefund.findFirst({
          where: {
            order_id: txn.order_id,
            refund_status: RefundStatus.PROCESSING,
          },
          include: { order: { select: { user_id: true, order_number: true } } },
          orderBy: { initiated_at: 'desc' },
        });
      }
    }

    if (!refund) {
      this.logger.warn(`No matching refund found for webhook (mihpayid=${mihpayid}, refundId=${payuRefundId})`);
      return { processed: false, reason: 'refund_not_found' };
    }

    // ── Idempotency guard ──────────────────────────────────────────────
    if (REFUND_TERMINAL_STATES.includes(refund.refund_status as any)) {
      this.logger.log(`Refund ${refund.refund_id} already in terminal state ${refund.refund_status}, skipping webhook`);
      return { processed: false, reason: 'already_terminal', status: refund.refund_status };
    }

    // ── Map PayU status to internal (using constants) ──────────────────
    const mappedStatus = PAYU_REFUND_STATUS_MAP[payuStatus];

    if (!mappedStatus) {
      this.logger.warn(`Unknown PayU refund status "${payuStatus}", treating as pending — ignoring`);
      return { processed: false, reason: 'unknown_status', payuStatus };
    }

    const isSuccess = mappedStatus === 'COMPLETED';

    if (isSuccess) {
      const completed = await this._completeRefundInTransaction(
        refund.refund_id,
        refund as any,
        payuRefundId || refund.payu_refund_id || '',
        webhookPayload,
        'SYSTEM_WEBHOOK',
      );

      this.logger.log(`Webhook: Refund ${refund.refund_id} marked COMPLETED`);

      this.eventEmitter.emit(
        'order.refund.completed',
        new OrderRefundCompletedEvent(refund.order as any, completed),
      );

      this.pushRefundSse(
        refund.order.user_id,
        refund.refund_id,
        refund.order_id,
        'COMPLETED',
        refund.amount.toFixed(2),
      );

      return { processed: true, status: 'COMPLETED', refundId: refund.refund_id };
    } else {
      const reason = String(
        webhookPayload['msg'] ?? webhookPayload['error_Message'] ?? 'PayU webhook reported failure',
      );
      await this._markFailed(refund.refund_id, refund.order_id, reason, webhookPayload);

      this.logger.log(`Webhook: Refund ${refund.refund_id} marked FAILED`);

      this.pushRefundSse(
        refund.order.user_id,
        refund.refund_id,
        refund.order_id,
        'FAILED',
        refund.amount.toFixed(2),
      );

      return { processed: true, status: 'FAILED', refundId: refund.refund_id };
    }
  }

  // ─── 9. Background: Check stuck PROCESSING refunds ──────────────────────

  /**
   * Finds refunds stuck in PROCESSING for more than `staleMinutes`
   * and checks their status with PayU.
   * Called by the cron job scheduled in RefundCronService.
   */
  async checkStuckRefunds(staleMinutes = 30): Promise<number> {
    const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000);

    const stuckRefunds = await this.prisma.orderRefund.findMany({
      where: {
        refund_status: RefundStatus.PROCESSING,
        processing_at: { lt: cutoff },
      },
      include: {
        order: {
          include: {
            user: { select: { user_id: true } },
            payment_transactions: {
              orderBy: { created_at: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (stuckRefunds.length === 0) return 0;

    this.logger.warn(`Found ${stuckRefunds.length} stuck PROCESSING refund(s), checking PayU status...`);

    let resolved = 0;
    for (const refund of stuckRefunds) {
      try {
        const paymentTxn = refund.order.payment_transactions[0];
        if (!paymentTxn?.gateway_payment_id) {
          this.logger.warn(`Stuck refund ${refund.refund_id} has no payment txn, marking FAILED`);
          await this._markFailed(refund.refund_id, refund.order_id, 'No payment transaction found during stuck-check');
          this.pushRefundSse(refund.order.user_id, refund.refund_id, refund.order_id, 'FAILED');
          resolved++;
          continue;
        }

        // Query PayU for actual status (reuse the refund API with check_action_status)
        // For now, if stuck > staleMinutes, mark as FAILED with a note
        this.logger.warn(
          `Refund ${refund.refund_id} stuck for >${staleMinutes}min, marking FAILED for manual review`,
        );
        await this._markFailed(
          refund.refund_id,
          refund.order_id,
          `Auto-failed: stuck in PROCESSING for >${staleMinutes} minutes. Please verify on PayU dashboard.`,
        );
        this.pushRefundSse(refund.order.user_id, refund.refund_id, refund.order_id, 'FAILED');
        resolved++;
      } catch (err) {
        this.logger.error(`Error checking stuck refund ${refund.refund_id}: ${err}`);
      }
    }

    return resolved;
  }
}
