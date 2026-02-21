import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../services/email.service';
import { EmailTemplate } from '../enums/email.enums';
import { OrderBookedEvent } from '../../order/events/order-booked.event';
import { OrderCancelledEvent } from '../../order/events/order-cancelled.event';
import { OrderDeliveredEvent } from '../../order/events/order-delivered.event';

// To handle Order creation, we also might need to listen to something emitted on pending/booked
// The order service emits 'order.booked' on OrderStatus.BOOKED update.
// However, order creation natively is PENDING.
// If your system updates to BOOKED on payment success, order.booked fires then.
// Let's also include order creation if needed, but standard is booking confirmation.

@Injectable()
export class OrderEmailListener {
    private readonly logger = new Logger(OrderEmailListener.name);

    constructor(
        private readonly emailService: EmailService,
        private readonly prisma: PrismaService,
    ) { }

    @OnEvent('order.booked')
    async handleOrderBookedEvent(event: OrderBookedEvent) {
        this.logger.log(
            `Order booked event received for order: ${event.order.order_number}`,
        );
        await this.handleOrderEvent(
            event.order.order_id,
            EmailTemplate.ORDER_CONFIRMATION,
        );
    }

    @OnEvent('order.cancelled')
    async handleOrderCancelledEvent(event: OrderCancelledEvent) {
        this.logger.log(
            `Order cancelled event received for order: ${event.order.order_number}`,
        );
        await this.handleOrderEvent(
            event.order.order_id,
            EmailTemplate.ORDER_CANCELLED,
            { reason: event.order.cancellation_reason },
        );
    }

    @OnEvent('order.delivered')
    async handleOrderDeliveredEvent(event: OrderDeliveredEvent) {
        this.logger.log(
            `Order delivered event received for order: ${event.order.order_number}`,
        );
        await this.handleOrderEvent(
            event.order.order_id,
            EmailTemplate.ORDER_DELIVERED,
        );
    }

    private async handleOrderEvent(
        orderId: string,
        template: EmailTemplate,
        additionalContext: Record<string, any> = {},
    ) {
        try {
            const order = await this.prisma.order.findUnique({
                where: { order_id: orderId },
                include: {
                    user: true,
                    items: {
                        include: { product: true }
                    },
                    shipping_address: true
                },
            });

            if (!order || !order.user || !order.user.email) {
                this.logger.warn(
                    `Could not send email for order ${orderId}: Missing order or user email`,
                );
                return;
            }

            await this.emailService.queueEmail({
                to: order.user.email,
                template: template,
                context: {
                    orderNumber: order.order_number,
                    totalAmount: Number(order.total_amount).toFixed(2),
                    userName: order.user.email.split('@')[0],
                    orderDate: order.created_at,
                    paymentMethod: order.payment_method,
                    shippingAddress: order.shipping_address,
                    items: order.items.map(item => ({
                        name: item.product?.title || 'Item',
                        quantity: item.quantity,
                        price: Number(item.unit_price).toFixed(2)
                    })),
                    ...additionalContext,
                },
            });
        } catch (error) {
            this.logger.error(
                `Failed to handle order event for email notifications: ${error.message}`,
            );
        }
    }
}
