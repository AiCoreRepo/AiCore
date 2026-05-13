// ============================================
// ORDER UTILITIES & HELPERS
// ============================================

import type { OrderStatus, PaymentStatus, RefundStatus, ReturnStatus, ReplacementStatus } from '../types/order.types';

// ============================================
// STATUS CONFIGURATIONS
// ============================================

export const ORDER_STATUS_CONFIG: Record<
    OrderStatus,
    {
        label: string;
        color: string;
        bgColor: string;
        icon: string;
        pulse?: boolean;
    }
> = {
    ORDER_PLACED: {
        label: 'Order Placed',
        color: '#6B7280',
        bgColor: '#F3F4F6',
        icon: '📦',
    },
    BOOKED: {
        label: 'Confirmed',
        color: '#8B6A2C',
        bgColor: '#F5E8C9',
        icon: '✓',
    },
    DISPATCHED: {
        label: 'Dispatched',
        color: '#6366F1',
        bgColor: '#EEF2FF',
        icon: '📤',
    },
    SHIPPED: {
        label: 'Shipped',
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        icon: '🚚',
    },
    OUT_FOR_DELIVERY: {
        label: 'Out for Delivery',
        color: '#8B5CF6',
        bgColor: '#F5F3FF',
        icon: '🏃',
        pulse: true,
    },
    DELIVERED: {
        label: 'Delivered',
        color: '#10B981',
        bgColor: '#D1FAE5',
        icon: '✓',
    },
    CANCELLED: {
        label: 'Cancelled',
        color: '#EF4444',
        bgColor: '#FEE2E2',
        icon: '✕',
    },
    PENDING: {
        label: 'Pending',
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        icon: '⏳',
    },
    PENDING_APPROVAL: {
        label: 'Pending Approval',
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        icon: '⏳',
    },
};

export const PAYMENT_STATUS_CONFIG: Record<
    PaymentStatus,
    { label: string; color: string; bgColor: string; icon?: string; pulse?: boolean }

> = {
    PENDING: {
        label: 'Payment Pending',
        color: '#F59E0B',
        bgColor: '#FEF3C7',
    },
    COMPLETED: {
        label: 'Paid',
        color: '#10B981',
        bgColor: '#D1FAE5',
    },
    FAILED: {
        label: 'Payment Failed',
        color: '#EF4444',
        bgColor: '#FEE2E2',
    },
    REFUNDED: {
        label: 'Refunded',
        color: '#8B5CF6',
        bgColor: '#F5F3FF',
    },
};

export const RETURN_STATUS_CONFIG: Record<
    ReturnStatus,
    { label: string; color: string }
> = {
    REQUESTED: { label: 'Return Requested', color: '#F59E0B' },
    APPROVED: { label: 'Return Approved', color: '#3B82F6' },
    REJECTED: { label: 'Return Rejected', color: '#EF4444' },
    PICKUP_SCHEDULED: { label: 'Pickup Scheduled', color: '#6366F1' },
    PICKED_UP: { label: 'Item Picked Up', color: '#8B5CF6' },
    QC_PASSED: { label: 'QC Passed', color: '#10B981' },
    QC_FAILED: { label: 'QC Failed', color: '#EF4444' },
    COMPLETED: { label: 'Return Completed', color: '#059669' },
};

export const REPLACEMENT_STATUS_CONFIG: Record<
    ReplacementStatus,
    { label: string; color: string }
> = {
    REQUESTED: { label: 'Replacement Requested', color: '#F59E0B' },
    APPROVED: { label: 'Replacement Approved', color: '#3B82F6' },
    REJECTED: { label: 'Replacement Rejected', color: '#EF4444' },
    PICKUP_SCHEDULED: { label: 'Pickup Scheduled', color: '#6366F1' },
    PICKED_UP: { label: 'Original Item Picked Up', color: '#8B5CF6' },
    DISPATCHED: { label: 'New Item Dispatched', color: '#F59E0B' },
    DELIVERED: { label: 'New Item Delivered', color: '#10B981' },
    COMPLETED: { label: 'Replacement Completed', color: '#059669' },
};

export const REFUND_STATUS_CONFIG: Record<
    RefundStatus,
    { label: string; color: string }
> = {
    PENDING_REVIEW: { label: 'Refund Initiated', color: '#10B981' },
    APPROVED: { label: 'Refund Approved', color: '#3B82F6' },
    REJECTED: { label: 'Refund Rejected', color: '#EF4444' },
    PROCESSING: { label: 'Processing Refund', color: '#8B5CF6' },
    COMPLETED: { label: 'Refund Completed', color: '#059669' },
    FAILED: { label: 'Refund Failed', color: '#EF4444' },
};

export const formatRefundStatus = (status?: string | null): string => {
    if (!status) return '';
    return REFUND_STATUS_CONFIG[status as RefundStatus]?.label || status.replace(/_/g, ' ');
};

// ============================================
// TIMELINE HELPERS
// ============================================

export const ORDER_TIMELINE_STEPS: OrderStatus[] = [
    'ORDER_PLACED',
    'BOOKED',
    'DISPATCHED',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
];

export const getTimelineProgress = (currentStatus: OrderStatus): number => {
    const currentIndex = ORDER_TIMELINE_STEPS.indexOf(currentStatus);
    if (currentIndex === -1) return 0;
    return ((currentIndex + 1) / ORDER_TIMELINE_STEPS.length) * 100;
};

export const isStepCompleted = (step: OrderStatus, currentStatus: OrderStatus): boolean => {
    const stepIndex = ORDER_TIMELINE_STEPS.indexOf(step);
    const currentIndex = ORDER_TIMELINE_STEPS.indexOf(currentStatus);
    return stepIndex <= currentIndex;
};

export const isStepActive = (step: OrderStatus, currentStatus: OrderStatus): boolean => {
    return step === currentStatus;
};

// ============================================
// DATE FORMATTERS
// ============================================

export const formatOrderDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

export const formatOrderTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return formatOrderDate(dateString);
};

export const ESTIMATED_DELIVERY_MIN_BUSINESS_DAYS = 7;
export const ESTIMATED_DELIVERY_MAX_BUSINESS_DAYS = 10;

const ESTIMATED_DELIVERY_STATUSES: OrderStatus[] = [
    'PENDING',
    'PENDING_APPROVAL',
    'ORDER_PLACED',
    'BOOKED',
    'DISPATCHED',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
];

export interface EstimatedDeliveryWindow {
    startDate: Date;
    endDate: Date;
    rangeLabel: string;
    businessDaysLabel: string;
}

const isBusinessDay = (date: Date): boolean => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
};

const addBusinessDays = (input: string | Date, businessDays: number): Date | null => {
    const baseDate = new Date(input);
    if (Number.isNaN(baseDate.getTime())) return null;

    const result = new Date(baseDate);
    result.setHours(12, 0, 0, 0);

    let remainingDays = businessDays;
    while (remainingDays > 0) {
        result.setDate(result.getDate() + 1);
        if (isBusinessDay(result)) {
            remainingDays -= 1;
        }
    }

    return result;
};

const formatEstimatedDeliveryDate = (date: Date): string =>
    date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
    });

export const shouldShowEstimatedDelivery = (status?: OrderStatus | string | null): boolean => {
    if (!status) return false;
    return ESTIMATED_DELIVERY_STATUSES.includes(status as OrderStatus);
};

export const getEstimatedDeliveryWindow = (
    input: string | Date,
    minBusinessDays = ESTIMATED_DELIVERY_MIN_BUSINESS_DAYS,
    maxBusinessDays = ESTIMATED_DELIVERY_MAX_BUSINESS_DAYS
): EstimatedDeliveryWindow | null => {
    const startDate = addBusinessDays(input, minBusinessDays);
    const endDate = addBusinessDays(input, maxBusinessDays);

    if (!startDate || !endDate) return null;

    return {
        startDate,
        endDate,
        rangeLabel: `${formatEstimatedDeliveryDate(startDate)} - ${formatEstimatedDeliveryDate(endDate)}`,
        businessDaysLabel: `${minBusinessDays}-${maxBusinessDays} business days`,
    };
};

// ============================================
// FILTER HELPERS
// ============================================

export const getOrderCountByFilter = (orders: any[], filter: string): number => {
    switch (filter) {
        case 'all':
            return orders.length;
        case 'active':
            return orders.filter(
                (o) =>
                    o.current_status !== 'DELIVERED' &&
                    o.current_status !== 'CANCELLED'
            ).length;
        case 'delivered':
            return orders.filter((o) => o.current_status === 'DELIVERED').length;
        case 'cancelled':
            return orders.filter((o) => o.current_status === 'CANCELLED').length;
        case 'returns':
            return orders.filter((o) => o.return_status).length;
        case 'replacements':
            return orders.filter((o) => o.replace_status).length;
        default:
            return 0;
    }
};

// ============================================
// CANCEL REASONS
// ============================================

export const CANCEL_REASONS = [
    { value: 'changed_mind', label: 'Changed my mind' },
    { value: 'ordered_by_mistake', label: 'Ordered by mistake' },
    { value: 'found_better_price', label: 'Found better price elsewhere' },
    { value: 'delivery_time', label: 'Delivery time too long' },
    { value: 'product_not_needed', label: 'Product not needed anymore' },
    { value: 'other', label: 'Other' },
];

// ============================================
// RETURN REASONS
// ============================================

export const RETURN_REASONS = [
    { value: 'DAMAGED', label: '📦 Product arrived damaged', emoji: '📦' },
    { value: 'DEFECTIVE', label: '⚠️ Product is defective', emoji: '⚠️' },
    { value: 'WRONG_ITEM', label: '❌ Wrong item received', emoji: '❌' },
    { value: 'SIZE_ISSUE', label: '📏 Size doesn\'t fit', emoji: '📏' },
    { value: 'COLOR_DIFFERENCE', label: '🎨 Color differs from image', emoji: '🎨' },
    { value: 'QUALITY_ISSUE', label: '⭐ Quality not as expected', emoji: '⭐' },
    { value: 'NOT_AS_DESCRIBED', label: '📝 Not as described', emoji: '📝' },
    { value: 'CHANGED_MIND', label: '💭 Changed my mind', emoji: '💭' },
    { value: 'OTHER', label: '📋 Other reason', emoji: '📋' },
];

// ============================================
// REPLACEMENT REASONS
// ============================================

export const REPLACEMENT_REASONS = [
    { value: 'DAMAGED', label: '📦 Product arrived damaged', emoji: '📦' },
    { value: 'DEFECTIVE', label: '⚠️ Product is defective', emoji: '⚠️' },
    { value: 'WRONG_ITEM', label: '❌ Wrong item received', emoji: '❌' },
    { value: 'SIZE_ISSUE', label: '📏 Need different size', emoji: '📏' },
    { value: 'COLOR_DIFFERENCE', label: '🎨 Need different color', emoji: '🎨' },
    { value: 'QUALITY_ISSUE', label: '⭐ Quality issue', emoji: '⭐' },
    { value: 'NOT_AS_DESCRIBED', label: '📝 Not as described', emoji: '📝' },
    { value: 'OTHER', label: '📋 Other reason', emoji: '📋' },
];
