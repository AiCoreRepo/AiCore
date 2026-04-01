import {
  Injectable,
  NotFoundException,
  BadRequestException,
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
import { OrderRefundInitiatedEvent } from './events/order-refund-initiated.event';
import { OrderRefundCompletedEvent } from './events/order-refund-completed.event';

@Injectable()
export class RefundService {
  private readonly logger = new Logger(RefundService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Initiate refund for a cancelled or returned order
   */
  async initiateRefund(
    orderId: string,
    userId: string,
    dto?: RequestRefundDto,
  ) {
    this.logger.log(`Initiating refund for order ${orderId}`);

    // Fetch order with validation
    const order = await this.prisma.order.findUnique({
      where: { order_id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.user_id !== userId) {
      throw new BadRequestException('Order does not belong to this user');
    }

    // Validate refund eligibility
    if (order.payment_method !== PaymentMethod.PREPAID) {
      throw new BadRequestException('Only prepaid orders can be refunded');
    }

    if (order.payment_status === PaymentStatus.REFUNDED) {
      throw new BadRequestException('Order already refunded');
    }

    if (
      order.refund_status === RefundStatus.INITIATED ||
      order.refund_status === RefundStatus.PROCESSING
    ) {
      throw new BadRequestException('Refund already in progress');
    }

    // Check if order is cancelled or has approved return
    const isEligible =
      order.current_status === 'CANCELLED' ||
      order.return_status === 'QC_PASSED' ||
      order.return_status === 'COMPLETED';

    if (!isEligible) {
      throw new BadRequestException(
        'Order must be cancelled or have approved return to initiate refund',
      );
    }

    // Create refund in transaction
    const refund = await this.prisma.$transaction(async (tx) => {
      // Create refund record
      const newRefund = await tx.orderRefund.create({
        data: {
          order_id: orderId,
          amount: order.total_amount,
          refund_status: RefundStatus.INITIATED,
          refund_reason: dto?.reason,
        },
      });

      // Update order status
      await tx.order.update({
        where: { order_id: orderId },
        data: {
          refund_status: RefundStatus.INITIATED,
          refund_amount: order.total_amount,
        },
      });

      return newRefund;
    });

    this.logger.log(`Refund initiated: ${refund.refund_id}`);

    // Emit event
    this.eventEmitter.emit(
      'order.refund.initiated',
      new OrderRefundInitiatedEvent(order, refund),
    );

    return refund;
  }

  /**
   * Admin marks refund as processing
   */
  async processRefund(refundId: string, adminId: string) {
    this.logger.log(`Processing refund ${refundId}`);

    const refund = await this.prisma.orderRefund.findUnique({
      where: { refund_id: refundId },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    if (refund.refund_status !== RefundStatus.INITIATED) {
      throw new BadRequestException(
        `Cannot process refund in ${refund.refund_status} state`,
      );
    }

    const updatedRefund = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.orderRefund.update({
        where: { refund_id: refundId },
        data: {
          refund_status: RefundStatus.PROCESSING,
          processing_at: new Date(),
          approved_by: adminId,
          approved_at: new Date(),
        },
      });

      await tx.order.update({
        where: { order_id: refund.order_id },
        data: {
          refund_status: RefundStatus.PROCESSING,
        },
      });

      return updated;
    });

    this.logger.log(`Refund ${refundId} marked as processing`);

    return updatedRefund;
  }

  /**
   * Admin completes refund with transaction ID
   */
  async completeRefund(
    refundId: string,
    adminId: string,
    transactionId: string,
  ) {
    this.logger.log(`Completing refund ${refundId}`);

    const refund = await this.prisma.orderRefund.findUnique({
      where: { refund_id: refundId },
      include: { order: true },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    if (refund.refund_status === RefundStatus.COMPLETED) {
      throw new BadRequestException('Refund already completed');
    }

    const updatedRefund = await this.prisma.$transaction(async (tx) => {
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

      const updated = await tx.orderRefund.update({
        where: { refund_id: refundId },
        data: {
          refund_status: RefundStatus.COMPLETED,
          completed_at: new Date(),
          transaction_id: transactionId,
        },
      });

      await tx.order.update({
        where: { order_id: refund.order_id },
        data: {
          refund_status: RefundStatus.COMPLETED,
          payment_status: PaymentStatus.REFUNDED,
        },
      });

      await tx.wallet.update({
        where: { wallet_id: wallet.wallet_id },
        data: {
          balance: creditedBalance,
        },
      });

      await tx.walletTransaction.create({
        data: {
          wallet_id: wallet.wallet_id,
          type: WalletTransactionType.CREDIT,
          source: WalletTransactionSource.REFUND,
          amount: refund.amount,
          reference_id: refund.refund_id,
          description: `Refund credited to wallet for order ${refund.order.order_number}`,
          status: WalletTransactionStatus.SUCCESS,
        },
      });

      return updated;
    });

    this.logger.log(`Refund completed: ${refundId}`);

    // Emit event
    this.eventEmitter.emit(
      'order.refund.completed',
      new OrderRefundCompletedEvent(refund.order, updatedRefund),
    );

    return updatedRefund;
  }

  /**
   * Admin rejects refund
   */
  async rejectRefund(refundId: string, adminId: string, reason: string) {
    this.logger.log(`Rejecting refund ${refundId}`);

    const refund = await this.prisma.orderRefund.findUnique({
      where: { refund_id: refundId },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    if (refund.refund_status === RefundStatus.COMPLETED) {
      throw new BadRequestException('Cannot reject completed refund');
    }

    const updatedRefund = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.orderRefund.update({
        where: { refund_id: refundId },
        data: {
          refund_status: RefundStatus.REJECTED,
          rejection_reason: reason,
        },
      });

      await tx.order.update({
        where: { order_id: refund.order_id },
        data: {
          refund_status: RefundStatus.REJECTED,
        },
      });

      return updated;
    });

    this.logger.log(`Refund rejected: ${refundId}`);

    return updatedRefund;
  }

  /**
   * Get refund status for an order
   */
  async getRefundStatus(orderId: string) {
    const refund = await this.prisma.orderRefund.findFirst({
      where: { order_id: orderId },
      orderBy: { initiated_at: 'desc' },
    });

    if (!refund) {
      throw new NotFoundException('No refund found for this order');
    }

    return refund;
  }

  /**
   * Get all refunds (admin)
   */
  async getAllRefunds(status?: RefundStatus) {
    return this.prisma.orderRefund.findMany({
      where: status ? { refund_status: status } : undefined,
      include: {
        order: {
          include: {
            user: {
              select: {
                user_id: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { initiated_at: 'desc' },
    });
  }
}
