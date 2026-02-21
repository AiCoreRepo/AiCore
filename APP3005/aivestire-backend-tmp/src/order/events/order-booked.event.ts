import { Order } from '@prisma/client';

export class OrderBookedEvent {
  constructor(public readonly order: Order) {}
}
