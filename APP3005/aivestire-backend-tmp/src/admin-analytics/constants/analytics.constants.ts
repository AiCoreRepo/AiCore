import { OrderStatus } from '@prisma/client';

export const DELIVERED_STATUS = OrderStatus.DELIVERED;

/**
 * Only DELIVERED orders count as sales.
 * In-flight statuses (BOOKED, DISPATCHED, SHIPPED, OUT_FOR_DELIVERY) are excluded
 * because order can still be cancelled, returned, or refunded before COD is collected.
 */
export const VALID_ANALYTICS_ORDER_STATUSES = [OrderStatus.DELIVERED];

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
