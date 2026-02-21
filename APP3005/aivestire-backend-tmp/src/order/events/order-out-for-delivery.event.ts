import { Order } from '@prisma/client';

export class OrderOutForDeliveryEvent {
  constructor(public readonly order: Order) {}
}
