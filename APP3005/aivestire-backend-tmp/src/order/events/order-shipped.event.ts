import { Order } from '@prisma/client';

export class OrderShippedEvent {
    constructor(
        public readonly order: Order,
        public readonly trackingNumber: string,
    ) { }
}
