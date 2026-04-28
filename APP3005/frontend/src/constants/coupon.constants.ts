// ============================================
// COUPON CONSTANTS
// ============================================

import { CouponTypeEnum, CouponStatusEnum } from './coupon.enums';

// Admin Routes
export const ADMIN_COUPON_ROUTES = {
    ADMIN_COUPONS: '/admin-coupons',
    ADMIN_CREATE_COUPON: '/admin-coupons/create',
} as const;

// Human-readable labels for coupon types
export const COUPON_TYPE_LABELS: Record<CouponTypeEnum, string> = {
    [CouponTypeEnum.FLAT]: 'Flat Discount',
    [CouponTypeEnum.PERCENTAGE]: 'Percentage Discount',
    [CouponTypeEnum.DELIVERY]: 'Free Delivery',
};

// Human-readable labels for coupon statuses
export const COUPON_STATUS_LABELS: Record<CouponStatusEnum, string> = {
    [CouponStatusEnum.ACTIVE]: 'Active',
    [CouponStatusEnum.DISABLED]: 'Disabled',
    [CouponStatusEnum.EXPIRED]: 'Expired',
};

// Status badge colors (matches Midnight Luxury design)
export const COUPON_STATUS_META: Record<CouponStatusEnum, { color: string; bg: string; border: string; dot: string }> = {
    [CouponStatusEnum.ACTIVE]: {
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgba(16, 185, 129, 0.35)',
        dot: '#10B981',
    },
    [CouponStatusEnum.DISABLED]: {
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.35)',
        dot: '#F59E0B',
    },
    [CouponStatusEnum.EXPIRED]: {
        color: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.1)',
        border: 'rgba(239, 68, 68, 0.35)',
        dot: '#EF4444',
    },
};

// Pagination
export const COUPONS_PER_PAGE = 10;
