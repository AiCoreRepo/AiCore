// ============================================
// PAYMENT ORCHESTRATION SERVICE
// ============================================

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RazorpayGatewayService } from './razorpay-gateway.service';
import {
    InitiatePaymentDto,
    VerifyPaymentDto,
    InitiateRefundDto,
    CreateRazorpayOrderResponse,
    PaymentVerificationResponse,
} from '../dto/payment.dto';
import {
    PaymentGateway,
    PaymentTransactionStatus,
    RazorpayWebhookEvent,
} from '../enums/payment.enums';
import {
    RAZORPAY_CONSTANTS,
    PAYMENT_ERROR_CODES,
    PAYMENT_MESSAGES,
} from '../constants/payment.constants';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly razorpayGateway: RazorpayGatewayService,
    ) { }

    // ============================================
    // INITIATE PAYMENT (Create Razorpay Order)
    // ============================================

    /**
     * Creates a Razorpay order for a given internal order.
     * Called when user selects online payment and clicks "Pay Now".
     */
    async initiateRazorpayPayment(
        userId: string,
        dto: InitiatePaymentDto,
    ): Promise<CreateRazorpayOrderResponse> {
        this.logger.log(`Initiating Razorpay payment for order: ${dto.orderId}`);

        // 1. Fetch the order with user details
        const order = await this.prisma.order.findUnique({
            where: { order_id: dto.orderId },
            include: {
                user: true,
                payment_transactions: {
                    where: {
                        status: {
                            in: [
                                PaymentTransactionStatus.CAPTURED,
                                PaymentTransactionStatus.AUTHORIZED,
                            ],
                        },
                    },
                },
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // 2. Verify ownership
        if (order.user_id !== userId) {
            throw new BadRequestException('Unauthorized to pay for this order');
        }

        // 3. Check if already paid
        if (order.payment_status === PaymentStatus.COMPLETED) {
            throw new ConflictException(PAYMENT_MESSAGES.ALREADY_PAID);
        }

        // 4. Check if active transaction already exists
        if (order.payment_transactions.length > 0) {
            throw new ConflictException(PAYMENT_MESSAGES.ALREADY_PAID);
        }

        // 5. Convert amount to paise
        const amountInPaise = RAZORPAY_CONSTANTS.MIN_AMOUNT_PAISE > 0
            ? Math.max(
                this.decimalToPaise(Number(order.total_amount)),
                RAZORPAY_CONSTANTS.MIN_AMOUNT_PAISE,
            )
            : this.decimalToPaise(Number(order.total_amount));

        // 6. Generate receipt
        const receipt = this.generateReceipt(order.order_id);

        // 7. Create Razorpay order
        const razorpayOrder = await this.razorpayGateway.createOrder(
            amountInPaise,
            RAZORPAY_CONSTANTS.CURRENCY,
            receipt,
            {
                order_id: order.order_id,
                order_number: order.order_number,
                user_id: userId,
            },
        );

        // 8. Persist transaction record
        await this.prisma.paymentTransaction.create({
            data: {
                order_id: order.order_id,
                gateway: PaymentGateway.RAZORPAY,
                gateway_order_id: razorpayOrder.id,
                amount_paise: amountInPaise,
                currency: RAZORPAY_CONSTANTS.CURRENCY,
                receipt,
                status: PaymentTransactionStatus.CREATED,
                metadata: {
                    razorpay_order: razorpayOrder,
                },
            },
        });

        this.logger.log(
            `Razorpay order ${razorpayOrder.id} created for internal order ${order.order_number}`,
        );

        return {
            razorpayOrderId: razorpayOrder.id,
            amount: amountInPaise,
            currency: RAZORPAY_CONSTANTS.CURRENCY,
            orderId: order.order_id,
            orderNumber: order.order_number,
            keyId: this.razorpayGateway.getKeyId(),
            prefill: {
                name: order.user.email.split('@')[0],
                email: order.user.email,
                contact: order.user.phone || '',
            },
        };
    }

    // ============================================
    // VERIFY PAYMENT (After Razorpay Checkout)
    // ============================================

    /**
     * Verifies payment signature and marks order as paid.
     * Called after user completes payment in Razorpay checkout.
     * This is the most critical step — signature must be verified before marking paid.
     */
    async verifyAndCapturePayment(
        userId: string,
        dto: VerifyPaymentDto,
    ): Promise<PaymentVerificationResponse> {
        this.logger.log(
            `Verifying payment: ${dto.razorpay_payment_id} for order: ${dto.order_id}`,
        );

        // 1. Verify signature (SECURITY CRITICAL)
        const isValid = this.razorpayGateway.verifyPaymentSignature({
            razorpay_order_id: dto.razorpay_order_id,
            razorpay_payment_id: dto.razorpay_payment_id,
            razorpay_signature: dto.razorpay_signature,
        });

        if (!isValid) {
            this.logger.warn(
                `Invalid signature for payment ${dto.razorpay_payment_id}`,
            );
            // Update transaction as failed
            await this.updateTransactionStatus(
                dto.razorpay_order_id,
                PaymentTransactionStatus.FAILED,
                { failure_reason: PAYMENT_ERROR_CODES.INVALID_SIGNATURE },
            );
            throw new BadRequestException(PAYMENT_MESSAGES.INVALID_SIGNATURE);
        }

        // 2. Fetch transaction from DB
        const transaction = await this.prisma.paymentTransaction.findFirst({
            where: { gateway_order_id: dto.razorpay_order_id },
            include: { order: true },
        });

        if (!transaction) {
            throw new NotFoundException('Payment transaction not found');
        }

        // 3. Verify ownership
        if (transaction.order.user_id !== userId) {
            throw new BadRequestException('Unauthorized');
        }

        // 4. Idempotency: already captured?
        if (transaction.status === PaymentTransactionStatus.CAPTURED) {
            return {
                success: true,
                orderId: transaction.order_id,
                orderNumber: transaction.order.order_number,
                paymentId: dto.razorpay_payment_id,
                message: PAYMENT_MESSAGES.PAYMENT_VERIFIED,
            };
        }

        // 5. Fetch payment details from Razorpay to confirm
        const razorpayPayment = await this.razorpayGateway.fetchPayment(
            dto.razorpay_payment_id,
        );

        // 6. Verify amount matches
        if (razorpayPayment.amount !== transaction.amount_paise) {
            this.logger.error(
                `Amount mismatch: expected ${transaction.amount_paise}, got ${razorpayPayment.amount}`,
            );
            throw new BadRequestException(PAYMENT_ERROR_CODES.AMOUNT_MISMATCH);
        }

        // 7. Update everything in a transaction
        await this.prisma.$transaction(async (tx) => {
            // Update payment transaction
            await tx.paymentTransaction.update({
                where: { transaction_id: transaction.transaction_id },
                data: {
                    gateway_payment_id: dto.razorpay_payment_id,
                    status: PaymentTransactionStatus.CAPTURED,
                    payment_method: razorpayPayment.method,
                    captured_at: new Date(),
                    metadata: {
                        ...(transaction.metadata as object),
                        razorpay_payment: razorpayPayment,
                        verified_at: new Date().toISOString(),
                    },
                },
            });

            // Update order payment status
            await tx.order.update({
                where: { order_id: transaction.order_id },
                data: {
                    payment_status: PaymentStatus.COMPLETED,
                    current_status: OrderStatus.BOOKED, // Auto-advance to BOOKED after payment
                },
            });

            // Add status history
            await tx.orderStatusHistory.create({
                data: {
                    order_id: transaction.order_id,
                    from_status: OrderStatus.PENDING,
                    to_status: OrderStatus.BOOKED,
                    notes: `Payment captured via Razorpay. Payment ID: ${dto.razorpay_payment_id}`,
                    changed_by_type: 'SYSTEM',
                },
            });
        });

        this.logger.log(
            `Payment ${dto.razorpay_payment_id} verified and captured for order ${transaction.order.order_number}`,
        );

        return {
            success: true,
            orderId: transaction.order_id,
            orderNumber: transaction.order.order_number,
            paymentId: dto.razorpay_payment_id,
            message: PAYMENT_MESSAGES.PAYMENT_VERIFIED,
        };
    }

    // ============================================
    // WEBHOOK HANDLER
    // ============================================

    /**
     * Handles Razorpay webhook events.
     * Provides server-side confirmation independent of frontend callback.
     */
    async handleWebhook(
        rawBody: string,
        signature: string,
        payload: any,
    ): Promise<{ received: boolean }> {
        // 1. Verify webhook signature
        const isValid = this.razorpayGateway.verifyWebhookSignature(rawBody, signature);
        if (!isValid) {
            this.logger.warn('Invalid webhook signature received');
            throw new BadRequestException('Invalid webhook signature');
        }

        const event = payload.event as RazorpayWebhookEvent;
        this.logger.log(`Processing webhook event: ${event}`);

        try {
            switch (event) {
                case RazorpayWebhookEvent.PAYMENT_CAPTURED:
                    await this.handlePaymentCaptured(payload.payload?.payment?.entity);
                    break;

                case RazorpayWebhookEvent.PAYMENT_FAILED:
                    await this.handlePaymentFailed(payload.payload?.payment?.entity);
                    break;

                case RazorpayWebhookEvent.ORDER_PAID:
                    await this.handleOrderPaid(payload.payload?.order?.entity);
                    break;

                case RazorpayWebhookEvent.REFUND_PROCESSED:
                    await this.handleRefundProcessed(payload.payload?.refund?.entity);
                    break;

                case RazorpayWebhookEvent.REFUND_FAILED:
                    await this.handleRefundFailed(payload.payload?.refund?.entity);
                    break;

                default:
                    this.logger.log(`Unhandled webhook event: ${event}`);
            }
        } catch (error: any) {
            this.logger.error(`Webhook processing error for ${event}: ${error.message}`);
            // Don't throw — return 200 to Razorpay to prevent retries for non-critical errors
        }

        return { received: true };
    }

    // ============================================
    // REFUND
    // ============================================

    /**
     * Initiate a refund for a completed payment
     */
    async initiateRefund(
        userId: string,
        dto: InitiateRefundDto,
    ): Promise<any> {
        this.logger.log(`Initiating refund for order: ${dto.orderId}`);

        // 1. Find the captured transaction
        const transaction = await this.prisma.paymentTransaction.findFirst({
            where: {
                order_id: dto.orderId,
                status: PaymentTransactionStatus.CAPTURED,
                gateway: PaymentGateway.RAZORPAY,
            },
            include: { order: true },
        });

        if (!transaction) {
            throw new NotFoundException('No captured payment found for this order');
        }

        if (transaction.order.user_id !== userId) {
            throw new BadRequestException('Unauthorized');
        }

        if (!transaction.gateway_payment_id) {
            throw new BadRequestException('Payment ID not found for refund');
        }

        // 2. Calculate refund amount
        const refundAmountPaise = dto.amount
            ? Math.round(dto.amount * 100)
            : transaction.amount_paise;

        // 3. Initiate refund via Razorpay
        const refund = await this.razorpayGateway.initiateRefund(
            transaction.gateway_payment_id,
            refundAmountPaise,
            {
                order_id: dto.orderId,
                reason: dto.reason || 'Customer requested refund',
            },
        );

        // 4. Update transaction status
        await this.prisma.paymentTransaction.update({
            where: { transaction_id: transaction.transaction_id },
            data: {
                status: PaymentTransactionStatus.REFUNDED,
                refund_id: refund.id,
                refunded_at: new Date(),
                metadata: {
                    ...(transaction.metadata as object),
                    refund: refund,
                },
            },
        });

        // 5. Update order payment status
        await this.prisma.order.update({
            where: { order_id: dto.orderId },
            data: {
                payment_status: PaymentStatus.REFUNDED,
                refund_status: 'INITIATED',
                refund_amount: refundAmountPaise / 100,
            },
        });

        this.logger.log(`Refund ${refund.id} initiated for order ${dto.orderId}`);
        return refund;
    }

    // ============================================
    // PAYMENT STATUS
    // ============================================

    /**
     * Get payment status for an order
     */
    async getPaymentStatus(userId: string, orderId: string) {
        const transaction = await this.prisma.paymentTransaction.findFirst({
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

        if (!transaction) {
            throw new NotFoundException('No payment transaction found for this order');
        }

        if (transaction.order.user_id !== userId) {
            throw new BadRequestException('Unauthorized');
        }

        return {
            transactionId: transaction.transaction_id,
            gateway: transaction.gateway,
            gatewayOrderId: transaction.gateway_order_id,
            gatewayPaymentId: transaction.gateway_payment_id,
            status: transaction.status,
            amountPaise: transaction.amount_paise,
            amountRupees: transaction.amount_paise / 100,
            currency: transaction.currency,
            paymentMethod: transaction.payment_method,
            capturedAt: transaction.captured_at,
            refundId: transaction.refund_id,
            refundedAt: transaction.refunded_at,
            orderStatus: transaction.order.current_status,
            orderPaymentStatus: transaction.order.payment_status,
        };
    }

    // ============================================
    // PRIVATE WEBHOOK HANDLERS
    // ============================================

    private async handlePaymentCaptured(paymentEntity: any): Promise<void> {
        if (!paymentEntity) return;

        const transaction = await this.prisma.paymentTransaction.findFirst({
            where: { gateway_order_id: paymentEntity.order_id },
        });

        if (!transaction || transaction.status === PaymentTransactionStatus.CAPTURED) {
            return; // Already processed or not found
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.paymentTransaction.update({
                where: { transaction_id: transaction.transaction_id },
                data: {
                    gateway_payment_id: paymentEntity.id,
                    status: PaymentTransactionStatus.CAPTURED,
                    payment_method: paymentEntity.method,
                    captured_at: new Date(),
                    metadata: {
                        ...(transaction.metadata as object),
                        webhook_payment: paymentEntity,
                    },
                },
            });

            await tx.order.update({
                where: { order_id: transaction.order_id },
                data: {
                    payment_status: PaymentStatus.COMPLETED,
                    current_status: OrderStatus.BOOKED,
                },
            });

            await tx.orderStatusHistory.create({
                data: {
                    order_id: transaction.order_id,
                    from_status: OrderStatus.PENDING,
                    to_status: OrderStatus.BOOKED,
                    notes: `Payment confirmed via webhook. Payment ID: ${paymentEntity.id}`,
                    changed_by_type: 'SYSTEM',
                },
            });
        });

        this.logger.log(`Webhook: Payment captured for order ${transaction.order_id}`);
    }

    private async handlePaymentFailed(paymentEntity: any): Promise<void> {
        if (!paymentEntity) return;

        const transaction = await this.prisma.paymentTransaction.findFirst({
            where: { gateway_order_id: paymentEntity.order_id },
        });

        if (!transaction) return;

        await this.prisma.paymentTransaction.update({
            where: { transaction_id: transaction.transaction_id },
            data: {
                status: PaymentTransactionStatus.FAILED,
                metadata: {
                    ...(transaction.metadata as object),
                    failure: {
                        code: paymentEntity.error_code,
                        description: paymentEntity.error_description,
                    },
                },
            },
        });

        await this.prisma.order.update({
            where: { order_id: transaction.order_id },
            data: { payment_status: PaymentStatus.FAILED },
        });

        this.logger.warn(`Webhook: Payment failed for order ${transaction.order_id}`);
    }

    private async handleOrderPaid(orderEntity: any): Promise<void> {
        if (!orderEntity) return;
        this.logger.log(`Webhook: Order paid event for Razorpay order ${orderEntity.id}`);
        // order.paid is a confirmation event — primary handling done in payment.captured
    }

    private async handleRefundProcessed(refundEntity: any): Promise<void> {
        if (!refundEntity) return;

        const transaction = await this.prisma.paymentTransaction.findFirst({
            where: { refund_id: refundEntity.id },
        });

        if (!transaction) return;

        await this.prisma.order.update({
            where: { order_id: transaction.order_id },
            data: {
                payment_status: PaymentStatus.REFUNDED,
                refund_status: 'COMPLETED',
            },
        });

        this.logger.log(`Webhook: Refund ${refundEntity.id} processed`);
    }

    private async handleRefundFailed(refundEntity: any): Promise<void> {
        if (!refundEntity) return;

        const transaction = await this.prisma.paymentTransaction.findFirst({
            where: { refund_id: refundEntity.id },
        });

        if (!transaction) return;

        await this.prisma.order.update({
            where: { order_id: transaction.order_id },
            data: { refund_status: 'FAILED' },
        });

        this.logger.error(`Webhook: Refund ${refundEntity.id} failed`);
    }

    // ============================================
    // PRIVATE UTILITIES
    // ============================================

    private decimalToPaise(amount: number): number {
        return Math.round(amount * 100);
    }

    private generateReceipt(orderId: string): string {
        const shortId = orderId.replace(/-/g, '').slice(0, 8).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        return `${RAZORPAY_CONSTANTS.RECEIPT_PREFIX}${shortId}_${timestamp}`;
    }

    private async updateTransactionStatus(
        gatewayOrderId: string,
        status: PaymentTransactionStatus,
        metadata?: Record<string, any>,
    ): Promise<void> {
        const transaction = await this.prisma.paymentTransaction.findFirst({
            where: { gateway_order_id: gatewayOrderId },
        });

        if (!transaction) return;

        await this.prisma.paymentTransaction.update({
            where: { transaction_id: transaction.transaction_id },
            data: {
                status,
                metadata: {
                    ...(transaction.metadata as object),
                    ...metadata,
                },
            },
        });
    }
}
