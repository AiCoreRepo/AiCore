import { OrderStatus } from '@prisma/client';

export const DELIVERED_STATUS = OrderStatus.DELIVERED;
export const VALID_ANALYTICS_ORDER_STATUSES = [
  OrderStatus.BOOKED,
  OrderStatus.DISPATCHED,
  OrderStatus.SHIPPED,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

