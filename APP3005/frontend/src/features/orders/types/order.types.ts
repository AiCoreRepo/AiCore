// ============================================
// MY ORDERS - TYPE DEFINITIONS
// ============================================

export type OrderStatus =
    | 'PENDING'
    | 'PENDING_APPROVAL'
    | 'ORDER_PLACED'
    | 'BOOKED'
    | 'DISPATCHED'
    | 'SHIPPED'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface CreateOrderItem {
    productId: string;
    quantity: number;
    size?: string;
    color?: string;
}

export interface CreateOrderPayload {
    items: CreateOrderItem[];
    shippingAddressId: string;
    paymentMethod: 'COD' | 'PREPAID' | 'PAYU' | 'WALLET';
    couponCode?: string;
}

export type PaymentMethod = 'PREPAID' | 'COD' | 'PAYU' | 'WALLET';

export type RefundStatus = 'INITIATED' | 'PENDING_REVIEW' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED' | 'ARCHIVED';

export type ReturnStatus =
    | 'REQUESTED'
    | 'APPROVED'
    | 'REJECTED'
    | 'PICKUP_SCHEDULED'
    | 'PICKED_UP'
    | 'QC_PASSED'
    | 'QC_FAILED'
    | 'COMPLETED';

export type ReplacementStatus =
    | 'REQUESTED'
    | 'APPROVED'
    | 'REJECTED'
    | 'PICKUP_SCHEDULED'
    | 'PICKED_UP'
    | 'DISPATCHED'
    | 'DELIVERED'
    | 'COMPLETED';

export interface OrderItem {
    order_item_id: string;
    product_id: string;
    product_name: string;
    product_image: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    size?: string | null;
    color?: string | null;
}

export interface ShippingAddress {
    address_id?: string;
    first_name?: string;
    last_name?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    phone?: string;
}

export interface Order {
    order_id: string;
    order_number: string;
    user_id: string;
    total_amount: Number;
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    current_status: OrderStatus;
    tracking_number?: string | null;
    delivery_partner?: string | null;

    // Timestamps
    created_at: string;
    updated_at: string;
    cancelled_at?: string | null;

    // Cancellation
    cancellation_reason?: string | null;
    cancel_feedback?: string | null;

    // Refund tracking
    refund_status?: RefundStatus | null;
    refund_amount?: number | null;

    // Return tracking
    return_status?: ReturnStatus | null;
    return_requested_at?: string | null;

    // Replacement tracking
    replace_status?: ReplacementStatus | null;
    replace_requested_at?: string | null;

    // Relations
    items: OrderItem[];
    shipping_address?: ShippingAddress | null;

    // Action flags (from backend)
    can_cancel?: boolean;
    can_return?: boolean;
    can_replace?: boolean;
}

export interface OrderFilters {
    status?: 'all' | 'active' | 'delivered' | 'cancelled' | 'returns' | 'replacements';
    page?: number;
    limit?: number;
}

export interface CancelOrderPayload {
    reason: string;
    custom_reason?: string;
    feedback?: string;
}

export interface ReturnOrderPayload {
    return_reason: 'DAMAGED' | 'DEFECTIVE' | 'WRONG_ITEM' | 'SIZE_ISSUE' | 'COLOR_DIFFERENCE' | 'QUALITY_ISSUE' | 'NOT_AS_DESCRIBED' | 'CHANGED_MIND' | 'OTHER';
    custom_reason?: string;
    feedback?: string;
}

export interface ReplaceOrderPayload {
    replace_reason: 'DAMAGED' | 'DEFECTIVE' | 'WRONG_ITEM' | 'SIZE_ISSUE' | 'COLOR_DIFFERENCE' | 'QUALITY_ISSUE' | 'NOT_AS_DESCRIBED' | 'OTHER';
    custom_reason?: string;
    feedback?: string;
}

export interface OrderTimeline {
    status: OrderStatus;
    timestamp: string;
    location?: string;
    notes?: string;
}
