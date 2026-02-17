import { Order, OrderRefund } from '@prisma/client';

export class OrderRefundInitiatedEvent {
    constructor(
        public readonly order: Order,
        public readonly refund: OrderRefund,
    ) { }
}
