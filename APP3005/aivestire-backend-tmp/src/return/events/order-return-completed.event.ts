import { Order, OrderReturn } from '@prisma/client';

export class OrderReturnCompletedEvent {
  constructor(
    public readonly order: Order,
    public readonly returnRequest: OrderReturn,
  ) {}
}
