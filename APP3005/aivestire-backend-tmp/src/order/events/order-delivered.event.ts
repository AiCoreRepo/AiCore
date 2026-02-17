import { Order } from '@prisma/client';

export class OrderDeliveredEvent {
    constructor(public readonly order: Order) { }
}
