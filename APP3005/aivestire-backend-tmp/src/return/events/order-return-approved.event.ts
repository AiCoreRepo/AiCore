import { Order, OrderReturn } from '@prisma/client';

export class OrderReturnApprovedEvent {
    constructor(
        public readonly order: Order,
        public readonly returnRequest: OrderReturn,
    ) { }
}
