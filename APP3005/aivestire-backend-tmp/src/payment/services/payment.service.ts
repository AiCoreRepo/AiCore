// ============================================
// PAYMENT SERVICE — PayU Orchestration
// ============================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentGateway } from '@prisma/client';
import { PayUGatewayService } from './payu-gateway.service';
import { PaymentRepository } from '../payment.repository';
import {
  InitiatePaymentDto,
  VerifyPaymentDto,
  InitiateRefundDto,
  CreatePayUOrderResponse,
  PaymentVerificationResponse,
} from '../dto/payment.dto';
import {
  PaymentTransactionStatus,
  PayUTransactionStatus,
} from '../enums/payment.enums';
import {
  PAYU_CONSTANTS,
  PAYMENT_ERROR_CODES,
  PAYMENT_MESSAGES,
} from '../constants/payment.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderBookedEvent } from '../../order/events/order-booked.event';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly payuGateway: PayUGatewayService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Initiate Payment ───────────────────────────────────────────────────

  /**
   * Initiates a PayU payment for the given internal order.
   * Generates a unique txnId, saves a CREATED transaction in DB,
   * and returns the checkout payload the frontend form-submits to PayU.
   */
  async initiatePayment(
    userId: string,
    dto: InitiatePaymentDto,
  ): Promise<CreatePayUOrderResponse> {
    this.logger.log(`Initiating PayU payment for order: ${dto.orderId}`);

    // 1. Load order + user
    const order = await this.paymentRepository.findOrderWithActiveTransactions(
      dto.orderId,
    );
    if (!order) throw new NotFoundException(PAYMENT_ERROR_CODES.ORDER_NOT_FOUND);

    // 2. Ownership check
    if (order.user_id !== userId) {
      throw new BadRequestException('Unauthorized to pay for this order');
    }

    // 3. Already paid?
    if (order.payment_status === 'COMPLETED') {
      throw new ConflictException(PAYMENT_MESSAGES.ALREADY_PAID);
    }

    // 4. Active transaction already exists (idempotency guard)
    if (order.payment_transactions.length > 0) {
      throw new ConflictException(PAYMENT_MESSAGES.ALREADY_PAID);
    }

    // 5. Amount validation
    const amount = Number(order.total_amount);
    if (
      amount < PAYU_CONSTANTS.MIN_AMOUNT ||
      amount > PAYU_CONSTANTS.MAX_AMOUNT
    ) {
      throw new BadRequestException(
        'Order amount is outside the allowed payment range',
      );
    }
    const amountPaise = Math.round(amount * 100);

    // 6. Build PayU fields
    const txnid = this.generateTxnId(order.order_id);
    const formattedAmount = amount.toFixed(2);
    const productinfo = `Order #${order.order_number}`;
    const firstname = order.user.email.split('@')[0];
    const email = order.user.email;
    const phone = order.user.phone ?? '';

    // 7. Persist CREATED transaction before redirecting
    await this.paymentRepository.createTransaction({
      orderId: order.order_id,
      gateway: PaymentGateway.PAYU,
      gatewayTxnId: txnid,
      amountPaise,
      receipt: txnid,
      metadata: {
        initiated_at: new Date().toISOString(),
        order_number: order.order_number,
        user_id: userId,
      },
    });

    // 8. Build and return checkout payload (hash computed server-side)
    const successUrl = this.configService.getOrThrow<string>('PAYU_SUCCESS_URL');
    const failureUrl = this.configService.getOrThrow<string>('PAYU_FAILURE_URL');

    const payload = this.payuGateway.buildCheckoutPayload({
      txnid,
      amount: formattedAmount,
      productinfo,
      firstname,
      email,
      phone,
      successUrl,
      failureUrl,
      udf1: order.order_id, // Lets us look up the order from postback
    });

    this.logger.log(
      `PayU payload built — txnid: ${txnid}, order: ${order.order_number}`,
    );
    return payload;
  }

  // ─── Success Handler ────────────────────────────────────────────────────

  /**
   * Called when PayU POSTs to /payments/success (surl).
   * Hash is verified before any DB mutation — never trust frontend data.
   * Idempotent: safe to call multiple times for the same txnid.
   */
  async handlePaymentSuccess(
    dto: VerifyPaymentDto,
  ): Promise<PaymentVerificationResponse> {
    this.logger.log(`PayU success postback for txnid: ${dto.txnid}`);

    // 1. SECURITY: verify response hash
    const isHashValid = this.payuGateway.verifyResponseHash(
      {
        txnid: dto.txnid,
        amount: dto.amount,
        productinfo: dto.productinfo,
        firstname: dto.firstname,
        email: dto.email,
        status: dto.status,
        additional_charges: dto.additional_charges ?? dto.additionalCharges,
        splitInfo: dto.splitInfo,
        udf1: dto.udf1,
        udf2: dto.udf2,
        udf3: dto.udf3,
        udf4: dto.udf4,
        udf5: dto.udf5,
      },
      dto.hash,
    );

    if (!isHashValid) {
      this.logger.warn(
        `PayU callback hash context — txnid: ${dto.txnid}, additional_charges: ${dto.additional_charges ?? dto.additionalCharges ?? 'n/a'}, splitInfo: ${dto.splitInfo ? 'present' : 'absent'}`,
      );
      this.logger.warn(`Invalid PayU hash for txnid: ${dto.txnid}`);
      throw new BadRequestException(PAYMENT_MESSAGES.INVALID_SIGNATURE);
    }

    // 2. Validate PayU status
    if (dto.status.toLowerCase() !== PayUTransactionStatus.SUCCESS) {
      throw new BadRequestException('Payment status is not success');
    }

    // 3. Fetch our DB record
    const transaction = await this.paymentRepository.findTransactionByTxnId(
      dto.txnid,
    );
    if (!transaction) {
      throw new NotFoundException(PAYMENT_ERROR_CODES.PAYMENT_NOT_FOUND);
    }

    // 4. Idempotency: already captured → return early
    if (transaction.status === PaymentTransactionStatus.CAPTURED) {
      return {
        success: true,
        orderId: transaction.order_id,
        orderNumber: transaction.order.order_number,
        paymentId: dto.mihpayid,
        message: PAYMENT_MESSAGES.PAYMENT_VERIFIED,
      };
    }

    // 5. Atomically capture and advance order
    const updatedOrder = await this.paymentRepository.capturePaymentAndBookOrder(
      {
        transactionId: transaction.transaction_id,
        orderId: transaction.order_id,
        gatewayPaymentId: dto.mihpayid,
        transactionMetadata: {
          ...(transaction.metadata as Record<string, unknown>),
          payu_response: {
            mihpayid: dto.mihpayid,
            status: dto.status,
            txnid: dto.txnid,
          },
          verified_at: new Date().toISOString(),
        },
      },
    );

    // 6. Downstream events
    this.eventEmitter.emit('order.booked', new OrderBookedEvent(updatedOrder));

    this.logger.log(
      `Payment captured — txnid: ${dto.txnid}, mihpayid: ${dto.mihpayid}`,
    );

    return {
      success: true,
      orderId: transaction.order_id,
      orderNumber: transaction.order.order_number,
      paymentId: dto.mihpayid,
      message: PAYMENT_MESSAGES.PAYMENT_VERIFIED,
    };
  }

  // ─── Failure Handler ────────────────────────────────────────────────────

  /**
   * Called when PayU POSTs to /payments/failure (furl).
   * Hash verified even on failure — spoofed failure callbacks are also a threat.
   * Idempotent: does not downgrade an already-captured payment.
   */
  async handlePaymentFailure(
    dto: VerifyPaymentDto,
  ): Promise<PaymentVerificationResponse> {
    this.logger.warn(`PayU failure postback for txnid: ${dto.txnid}`);

    // 1. SECURITY: verify hash on failure too
    const isHashValid = this.payuGateway.verifyResponseHash(
      {
        txnid: dto.txnid,
        amount: dto.amount,
        productinfo: dto.productinfo,
        firstname: dto.firstname,
        email: dto.email,
        status: dto.status,
        additional_charges: dto.additional_charges ?? dto.additionalCharges,
        splitInfo: dto.splitInfo,
        udf1: dto.udf1,
        udf2: dto.udf2,
        udf3: dto.udf3,
        udf4: dto.udf4,
        udf5: dto.udf5,
      },
      dto.hash,
    );

    if (!isHashValid) {
      this.logger.warn(`Invalid PayU hash on failure callback for txnid: ${dto.txnid}`);
      throw new BadRequestException(PAYMENT_MESSAGES.INVALID_SIGNATURE);
    }

    const transaction = await this.paymentRepository.findTransactionByTxnId(
      dto.txnid,
    );
    if (!transaction) {
      throw new NotFoundException(PAYMENT_ERROR_CODES.PAYMENT_NOT_FOUND);
    }

    const capturedTransaction =
      transaction.status === PaymentTransactionStatus.CAPTURED
        ? transaction
        : await this.paymentRepository.findCapturedTransactionForOrder(
            transaction.order_id,
            PaymentGateway.PAYU,
          );

    // 2. Idempotency: never downgrade an order that is already paid
    if (
      capturedTransaction ||
      transaction.order.payment_status === 'COMPLETED'
    ) {
      this.logger.warn(
        `Failure postback for already-paid order ${transaction.order.order_number}. Ignoring txnid ${dto.txnid}.`,
      );
      return {
        success: true,
        orderId: transaction.order_id,
        orderNumber: transaction.order.order_number,
        paymentId:
          capturedTransaction?.gateway_payment_id ??
          transaction.gateway_payment_id ??
          dto.mihpayid,
        message: PAYMENT_MESSAGES.PAYMENT_VERIFIED,
      };
    }

    // 3. Mark as failed
    await this.paymentRepository.markPaymentFailed({
      transactionId: transaction.transaction_id,
      orderId: transaction.order_id,
      errorCode: dto.error_code,
      errorMessage: dto.error_Message,
      existingMetadata: transaction.metadata as Record<string, unknown>,
    });

    this.logger.warn(
      `Payment marked FAILED — txnid: ${dto.txnid}, error: ${dto.error_code}`,
    );

    return {
      success: false,
      orderId: transaction.order_id,
      orderNumber: transaction.order.order_number,
      paymentId: dto.mihpayid,
      message: PAYMENT_MESSAGES.PAYMENT_FAILED,
    };
  }

  // ─── Payment Status ─────────────────────────────────────────────────────

  async getPaymentStatus(userId: string, orderId: string) {
    const transaction =
      await this.paymentRepository.findLatestTransactionForOrder(orderId);

    if (!transaction) {
      throw new NotFoundException('No payment transaction found for this order');
    }
    if (transaction.order.user_id !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    return {
      transactionId: transaction.transaction_id,
      gateway: transaction.gateway,
      gatewayTxnId: transaction.gateway_order_id,
      gatewayPaymentId: transaction.gateway_payment_id,
      status: transaction.status,
      amount: transaction.amount_paise,
      currency: transaction.currency,
      paymentMethod: transaction.payment_method,
      capturedAt: transaction.captured_at,
      refundId: transaction.refund_id,
      refundedAt: transaction.refunded_at,
      orderStatus: transaction.order.current_status,
      orderPaymentStatus: transaction.order.payment_status,
    };
  }

  // ─── Refund ──────────────────────────────────────────────────────────────

  /**
   * Records a refund in the DB.
   * Actual refund disbursement must be done via PayU dashboard or PayU Refund API.
   */
  async initiateRefund(
    userId: string,
    dto: InitiateRefundDto,
  ): Promise<{ message: string }> {
    this.logger.log(`Initiating refund for order: ${dto.orderId}`);

    const transaction =
      await this.paymentRepository.findCapturedTransactionForOrder(
        dto.orderId,
        PaymentGateway.PAYU,
      );

    if (!transaction) {
      throw new NotFoundException('No captured payment found for this order');
    }
    if (transaction.order.user_id !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    const refundAmountPaise = dto.amount
      ? Math.round(dto.amount * 100)
      : transaction.amount_paise;
    const refundId = `REFUND_${transaction.gateway_order_id}_${Date.now()}`;

    await this.paymentRepository.markPaymentRefunded({
      transactionId: transaction.transaction_id,
      orderId: dto.orderId,
      refundId,
      refundAmountPaise,
      existingMetadata: transaction.metadata as Record<string, unknown>,
    });

    this.logger.log(`Refund record created: ${refundId}`);
    return { message: PAYMENT_MESSAGES.REFUND_INITIATED };
  }

  // ─── Utilities ───────────────────────────────────────────────────────────

  /**
   * Generates a unique transaction ID for PayU.
   * Format: AIV_<8-char-order-short-id>_<8-digit-timestamp>
   * Must be ≤ 25 characters (PayU limit).
   */
  private generateTxnId(orderId: string): string {
    const shortId = orderId.replace(/-/g, '').slice(0, 8).toUpperCase();
    const timestamp = Date.now().toString().slice(-8);
    return `${PAYU_CONSTANTS.TXN_PREFIX}${shortId}_${timestamp}`;
  }
}
