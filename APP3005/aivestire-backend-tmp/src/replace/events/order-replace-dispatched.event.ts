import { Order, OrderReplacement } from '@prisma/client';

export class OrderReplaceDispatchedEvent {
    constructor(
        public readonly order: Order,
        public readonly replacement: OrderReplacement,
    ) { }
}
