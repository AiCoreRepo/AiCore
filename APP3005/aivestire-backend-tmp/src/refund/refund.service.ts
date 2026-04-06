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
  ) {}

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

    if (order.payment_method !== PaymentMethod.PREPAID) {
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
    if (refund.refund_status !== RefundStatus.PENDING_REVIEW) {
      throw new ConflictException(
        `Cannot trigger PayU refund: current status is ${refund.refund_status}. ` +
          `Only PENDING_REVIEW refunds can be triggered.`,
      );
    }

    // Locate the captured PayU transaction
    const paymentTxn = refund.order.payment_transactions[0];
    if (!paymentTxn?.gateway_payment_id) {
      throw new BadRequestException(
        'No valid PayU payment transaction found for this order',
      );
    }

    // Mark as PROCESSING first (persisted before calling PayU)
    await this.prisma.$transaction(async (tx) => {
      await tx.orderRefund.update({
        where: { refund_id: refundId },
        data: {
          refund_status: RefundStatus.PROCESSING,
          processing_at: new Date(),
          reviewed_by: adminId,
          reviewed_at: new Date(),
          approved_by: adminId,
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
        paymentTxn.gateway_order_id ?? paymentTxn.receipt ?? refundId,
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

      return completed;
    } else {
      // PayU returned a failure response
      const failReason =
        String(payuResponse['msg'] ?? payuResponse['message'] ?? 'PayU refund rejected');

      await this._markFailed(refundId, refund.order_id, failReason, payuResponse);

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

    const completed = await this._completeRefundInTransaction(
      refundId,
      refund as any,
      payuRefundId ?? refund.payu_refund_id ?? '',
      refund.payu_response as Record<string, unknown> | null ?? {},
      adminId,
    );

    this.logger.log(`Refund ${refundId} manually confirmed as COMPLETED`);

    this.eventEmitter.emit(
      'order.refund.completed',
      new OrderRefundCompletedEvent(refund.order, completed),
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

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.orderRefund.update({
        where: { refund_id: refundId },
        data: {
          refund_status: RefundStatus.REJECTED,
          rejection_reason: reason,
          reviewed_by: adminId,
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

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.orderRefund.update({
        where: { refund_id: refundId },
        data: {
          refund_status: RefundStatus.ARCHIVED,
          archived_at: new Date(),
          archived_by: adminId,
          review_notes: notes,
          reviewed_by: adminId,
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
    return this.prisma.$transaction(async (tx) => {
      // 1. Update refund record
      const updated = await tx.orderRefund.update({
        where: { refund_id: refundId },
        data: {
          refund_status: RefundStatus.COMPLETED,
          completed_at: new Date(),
          payu_refund_id: payuRefundId || undefined,
          payu_response: payuResponse as Prisma.InputJsonValue,
          reviewed_by: adminId,
          reviewed_at: new Date(),
        },
      });

      // 2. Update order
      await tx.order.update({
        where: { order_id: refund.order_id },
        data: {
          refund_status: RefundStatus.COMPLETED,
          payment_status: PaymentStatus.REFUNDED,
        },
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
}
