import { Order, OrderRefund } from '@prisma/client';

export class OrderRefundCompletedEvent {
  constructor(
    public readonly order: Order,
    public readonly refund: OrderRefund,
  ) {}
}
