import { Order, OrderReplacement } from '@prisma/client';

export class OrderReplaceRequestedEvent {
    constructor(
        public readonly order: Order,
        public readonly replacement: OrderReplacement,
    ) { }
}
