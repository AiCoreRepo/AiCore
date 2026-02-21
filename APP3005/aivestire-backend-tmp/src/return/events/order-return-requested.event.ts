import { Order, OrderReturn } from '@prisma/client';

export class OrderReturnRequestedEvent {
  constructor(
    public readonly order: Order,
    public readonly returnRequest: OrderReturn,
  ) {}
}
