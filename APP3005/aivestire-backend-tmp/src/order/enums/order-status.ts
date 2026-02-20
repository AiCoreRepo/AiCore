const OrderStatus = {
    PENDING: 'PENDING',
    BOOKED: 'BOOKED',
    DISPATCHED: 'DISPATCHED',
    SHIPPED: 'SHIPPED',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];