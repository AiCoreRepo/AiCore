// ============================================
// PAYMENT REPOSITORY
// ============================================
// Single point of truth for all payment-related DB access.
// The service layer must NEVER call PrismaService directly.

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PaymentGateway,
  OrderStatus,
  PaymentStatus,
  PaymentTransactionStatus as PrismaPaymentTransactionStatus,
  Prisma,
} from '@prisma/client';
import { PaymentTransactionStatus } from './enums/payment.enums';

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreateTransactionInput {
  orderId: string;
  gateway: PaymentGateway;
  gatewayTxnId: string;
  amount: number;
  receipt: string;
  metadata: Record<string, unknown>;
}

export interface UpdateTransactionInput {
  status: PaymentTransactionStatus;
  gatewayPaymentId?: string;
  paymentMethod?: string;
  capturedAt?: Date;
  refundId?: string;
  refundedAt?: Date;
  metadata?: Record<string, unknown>;
}

// ─── Repository ──────────────────────────────────────────────────────────────

@Injectable()
export class PaymentRepository {
  private readonly logger = new Logger(PaymentRepository.name);

  constructor(private readonly prisma: PrismaService) { }

  // ─── Order queries ──────────────────────────────────────────────────────

  async findOrderWithUser(orderId: string) {
    return this.prisma.order.findUnique({
      where: { order_id: orderId },
      include: { user: true },
    });
  }

  async findOrderWithActiveTransactions(orderId: string) {
    return this.prisma.order.findUnique({
      where: { order_id: orderId },
      include: {
        user: true,
        payment_transactions: {
          where: {
            status: {
              in: [
                PrismaPaymentTransactionStatus.CAPTURED,
                PrismaPaymentTransactionStatus.AUTHORIZED,
              ],
            },
          },
        },
      },
    });
  }

  // ─── Transaction queries ─────────────────────────────────────────────────

  async findTransactionByTxnId(gatewayTxnId: string) {
    return this.prisma.paymentTransaction.findFirst({
      where: { gateway_order_id: gatewayTxnId },
      include: {
        order: {
          include: { user: true },
        },
      },
    });
  }

  async findLatestTransactionForOrder(orderId: string) {
    return this.prisma.paymentTransaction.findFirst({
      where: { order_id: orderId },
      orderBy: { created_at: 'desc' },
      include: {
        order: {
          select: {
            user_id: true,
            order_number: true,
            payment_status: true,
            current_status: true,
          },
        },
      },
    });
  }

  async findCapturedTransactionForOrder(
    orderId: string,
    gateway: PaymentGateway,
  ) {
    return this.prisma.paymentTransaction.findFirst({
      where: {
        order_id: orderId,
        status: PrismaPaymentTransactionStatus.CAPTURED,
        gateway,
      },
      include: { order: true },
    });
  }

  async findTransactionByRefundId(refundId: string) {
    return this.prisma.paymentTransaction.findFirst({
      where: { refund_id: refundId },
    });
  }

  // ─── Transaction mutations ───────────────────────────────────────────────

  async createTransaction(data: CreateTransactionInput) {
    return this.prisma.paymentTransaction.create({
      data: {
        order_id: data.orderId,
        gateway: data.gateway,
        gateway_order_id: data.gatewayTxnId,
        amount_paise: data.amount,
        currency: 'INR',
        receipt: data.receipt,
        status: PrismaPaymentTransactionStatus.CREATED,
        metadata: data.metadata as Prisma.InputJsonValue,
      },
    });
  }

  async updateTransaction(
    transactionId: string,
    data: UpdateTransactionInput,
  ) {
    return this.prisma.paymentTransaction.update({
      where: { transaction_id: transactionId },
      data: {
        status: data.status as unknown as PrismaPaymentTransactionStatus,
        ...(data.gatewayPaymentId && {
          gateway_payment_id: data.gatewayPaymentId,
        }),
        ...(data.paymentMethod && { payment_method: data.paymentMethod }),
        ...(data.capturedAt && { captured_at: data.capturedAt }),
        ...(data.refundId && { refund_id: data.refundId }),
        ...(data.refundedAt && { refunded_at: data.refundedAt }),
        ...(data.metadata && {
          metadata: data.metadata as Prisma.InputJsonValue,
        }),
      },
    });
  }

  // ─── Complex atomic operations ───────────────────────────────────────────

  /**
   * Atomically captures the payment and advances the order to BOOKED.
   * Returns the updated Order record (used to emit the order.booked event).
   */
  async capturePaymentAndBookOrder(params: {
    transactionId: string;
    orderId: string;
    gatewayPaymentId: string;
    transactionMetadata: Record<string, unknown>;
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { transaction_id: params.transactionId },
        data: {
          gateway_payment_id: params.gatewayPaymentId,
          status: PrismaPaymentTransactionStatus.CAPTURED,
          captured_at: new Date(),
          metadata: params.transactionMetadata as Prisma.InputJsonValue,
        },
      });

      const updatedOrder = await tx.order.update({
        where: { order_id: params.orderId },
        data: {
          payment_status: PaymentStatus.COMPLETED,
          current_status: OrderStatus.BOOKED,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          order_id: params.orderId,
          from_status: OrderStatus.PENDING,
          to_status: OrderStatus.BOOKED,
          notes: `Payment captured via PayU. mihpayid: ${params.gatewayPaymentId}`,
          changed_by_type: 'SYSTEM',
        },
      });

      return updatedOrder;
    });
  }

  /**
   * Atomically marks the payment as FAILED and order payment_status as FAILED.
   */
  async markPaymentFailed(params: {
    transactionId: string;
    orderId: string;
    errorCode?: string;
    errorMessage?: string;
    existingMetadata: Record<string, unknown>;
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { transaction_id: params.transactionId },
        data: {
          status: PrismaPaymentTransactionStatus.FAILED,
          metadata: {
            ...params.existingMetadata,
            failure: {
              code: params.errorCode ?? 'UNKNOWN',
              description: params.errorMessage ?? 'Payment failed',
            },
          } as Prisma.InputJsonValue,
        },
      });

      await tx.order.update({
        where: { order_id: params.orderId },
        data: { payment_status: PaymentStatus.FAILED },
      });
    });
  }

  /**
   * Atomically marks the payment as REFUNDED and updates order refund tracking.
   */
  async markPaymentRefunded(params: {
    transactionId: string;
    orderId: string;
    refundId: string;
    refundAmount: number;
    existingMetadata: Record<string, unknown>;
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { transaction_id: params.transactionId },
        data: {
          status: PrismaPaymentTransactionStatus.REFUNDED,
          refund_id: params.refundId,
          refunded_at: new Date(),
          metadata: {
            ...params.existingMetadata,
            refund_id: params.refundId,
            refunded_at: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      await tx.order.update({
        where: { order_id: params.orderId },
        data: {
          payment_status: PaymentStatus.REFUNDED,
          refund_status: 'INITIATED',
          refund_amount: params.refundAmount,
        },
      });
    });
  }
}
