import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderBookedEvent } from '../events/order-booked.event';
import { OrderShippedEvent } from '../events/order-shipped.event';
import { OrderOutForDeliveryEvent } from '../events/order-out-for-delivery.event';
import { OrderDeliveredEvent } from '../events/order-delivered.event';
import { OrderCancelledEvent } from '../events/order-cancelled.event';
import { OrderRefundInitiatedEvent } from '../../refund/events/order-refund-initiated.event';
import { OrderRefundCompletedEvent } from '../../refund/events/order-refund-completed.event';
import { OrderReturnRequestedEvent } from '../../return/events/order-return-requested.event';
import { OrderReturnApprovedEvent } from '../../return/events/order-return-approved.event';
import { OrderReturnCompletedEvent } from '../../return/events/order-return-completed.event';
import { OrderReplaceRequestedEvent } from '../../replace/events/order-replace-requested.event';
import { OrderReplaceDispatchedEvent } from '../../replace/events/order-replace-dispatched.event';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsQueueService } from '../../queues/sms-queue.service';

@Injectable()
export class OrderEventListener {
  private readonly logger = new Logger(OrderEventListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsQueueService: SmsQueueService,
  ) {}

  // ============================================
  // ORDER LIFECYCLE EVENTS
  // ============================================

  @OnEvent('order.booked')
  async handleOrderBooked(event: OrderBookedEvent) {
    this.logger.log(`Order ${event.order.order_number} has been booked`);

    // ─── SMS: Order Confirmation ─────────────────────────────────────────
    try {
      // Fetch full order details including user phone, items, and shipping address
      const fullOrder = await this.prisma.order.findUnique({
        where: { order_id: event.order.order_id },
        include: {
          user: { select: { user_id: true, email: true, phone: true } },
          items: {
            select: {
              product_name: true,
              quantity: true,
              size: true,
              color: true,
            },
          },
          shipping_address: {
            select: { city: true, state: true, phone: true },
          },
        },
      });

      const phone = fullOrder?.user?.phone || fullOrder?.shipping_address?.phone;

      if (!fullOrder) {
        this.logger.warn(`Order ${event.order.order_id} not found for SMS dispatch`);
      } else if (!phone) {
        this.logger.warn(
          `Order ${event.order.order_number}: buyer has no phone number — skipping SMS`,
        );
      } else {
        // Derive a friendly display name from the email (e.g. john.doe@... → John)
        const displayName = fullOrder.user.email.split('@')[0]?.split('.')[0] ?? 'Customer';
        const buyerName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

        await this.smsQueueService.enqueueOrderConfirmationSms({
          to: phone,
          buyerName,
          orderId: fullOrder.order_id,
          orderNumber: fullOrder.order_number,
          items: fullOrder.items.map((item) => ({
            productName: item.product_name,
            quantity: item.quantity,
            size: item.size ?? undefined,
            color: item.color ?? undefined,
          })),
          totalAmount: Number(fullOrder.total_amount),
          paymentMethod: fullOrder.payment_method,
          estimatedDelivery: fullOrder.estimated_delivery_date ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          shippingCity: fullOrder.shipping_address?.city ?? '',
          shippingState: fullOrder.shipping_address?.state ?? '',
        });
      }
    } catch (error) {
      // SMS failure must never affect the order flow
      this.logger.error(
        `Failed to enqueue order confirmation SMS for ${event.order.order_number}:`,
        error instanceof Error ? error.message : error,
      );
    }

    this.logger.log('Order booked notifications sent');
  }

  @OnEvent('order.shipped')
  async handleOrderShipped(event: OrderShippedEvent) {
    this.logger.log(
      `Order ${event.order.order_number} shipped with tracking: ${event.trackingNumber}`,
    );

    // TODO: Send shipping update email
    // TODO: Send SMS with tracking link
    // TODO: Update customer

    this.logger.log('Shipping notifications sent');
  }

  @OnEvent('order.out_for_delivery')
  async handleOutForDelivery(event: OrderOutForDeliveryEvent) {
    this.logger.log(`Order ${event.order.order_number} is out for delivery`);

    // TODO: Send push notification
    // TODO: Send SMS alert

    this.logger.log('Out for delivery notifications sent');
  }

  @OnEvent('order.delivered')
  async handleDelivered(event: OrderDeliveredEvent) {
    this.logger.log(`Order ${event.order.order_number} has been delivered`);

    // TODO: Send delivery confirmation email
    // TODO: Request product review
    // TODO: Update analytics

    this.logger.log('Delivery confirmation sent');
  }

  @OnEvent('order.cancelled')
  async handleCancelled(event: OrderCancelledEvent) {
    this.logger.log(`Order ${event.order.order_number} has been cancelled`);

    // TODO: Send cancellation email
    // TODO: Process refund if prepaid
    // TODO: Update reports

    this.logger.log('Cancellation notifications sent');
  }

  // ============================================
  // REFUND EVENTS
  // ============================================

  @OnEvent('order.refund.initiated')
  async handleRefundInitiated(event: OrderRefundInitiatedEvent) {
    this.logger.log(
      `Refund initiated for order ${event.order.order_number} - Amount: ${event.refund.amount}`,
    );

    // TODO: Send email to customer about refund initiation
    // TODO: Notify finance team
    // TODO: Update customer dashboard

    this.logger.log('Refund initiation notifications sent');
  }

  @OnEvent('order.refund.completed')
  async handleRefundCompleted(event: OrderRefundCompletedEvent) {
    this.logger.log(
      `Refund completed for order ${event.order.order_number} - Transaction ID: ${event.refund.transaction_id}`,
    );

    // TODO: Send refund completion email with transaction details
    // TODO: Send SMS confirmation
    // TODO: Update analytics

    this.logger.log('Refund completion notifications sent');
  }

  // ============================================
  // RETURN EVENTS
  // ============================================

  @OnEvent('order.return.requested')
  async handleReturnRequested(event: OrderReturnRequestedEvent) {
    this.logger.log(
      `Return requested for order ${event.order.order_number} - Reason: ${event.returnRequest.return_reason}`,
    );

    // TODO: Send email to customer confirming return request
    // TODO: Notify admin team for approval
    // TODO: Send SMS confirmation

    this.logger.log('Return request notifications sent');
  }

  @OnEvent('order.return.approved')
  async handleReturnApproved(event: OrderReturnApprovedEvent) {
    this.logger.log(`Return approved for order ${event.order.order_number}`);

    // TODO: Send email to customer with pickup instructions
    // TODO: Notify logistics partner
    // TODO: Send pickup scheduling link

    this.logger.log('Return approval notifications sent');
  }

  @OnEvent('order.return.completed')
  async handleReturnCompleted(event: OrderReturnCompletedEvent) {
    this.logger.log(`Return completed for order ${event.order.order_number}`);

    // TODO: Send return completion email
    // TODO: Notify customer about refund status
    // TODO: Update analytics

    this.logger.log('Return completion notifications sent');
  }

  // ============================================
  // REPLACEMENT EVENTS
  // ============================================

  @OnEvent('order.replace.requested')
  async handleReplaceRequested(event: OrderReplaceRequestedEvent) {
    this.logger.log(
      `Replacement requested for order ${event.order.order_number} - Reason: ${event.replacement.replace_reason}`,
    );

    // TODO: Send email to customer confirming replacement request
    // TODO: Notify admin team for approval
    // TODO: Send SMS confirmation

    this.logger.log('Replacement request notifications sent');
  }

  @OnEvent('order.replace.dispatched')
  async handleReplaceDispatched(event: OrderReplaceDispatchedEvent) {
    this.logger.log(
      `Replacement dispatched for order ${event.order.order_number} - Tracking: ${event.replacement.delivery_tracking}`,
    );

    // TODO: Send email with new tracking number
    // TODO: Send SMS with delivery estimate
    // TODO: Update customer dashboard

    this.logger.log('Replacement dispatch notifications sent');
  }
}
