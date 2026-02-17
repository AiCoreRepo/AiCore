import { Order } from '@prisma/client';

export class OrderCancelledEvent {
    constructor(public readonly order: Order) { }
}
