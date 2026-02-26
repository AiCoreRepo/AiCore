// ============================================
// COUPON TYPES
// ============================================

import { CouponTypeEnum, CouponStatusEnum } from '@/constants/coupon.enums';

export interface Coupon {
    id: string;
    title: string;
    code: string;
    description: string;
    discountType: CouponTypeEnum;
    discountValue: number;
    minOrderAmount: number;
    allowedPincodes: string[];
    termsAndConditions: string;
    reason: string;
    startDate: string;
    endDate: string;
    maxUsage: number;
    currentUsage?: number;
    status: CouponStatusEnum;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateCouponPayload {
    title: string;
    code: string;
    description: string;
    discountType: CouponTypeEnum;
    discountValue: number;
    minOrderAmount: number;
    allowedPincodes: string[];
    termsAndConditions: string;
    reason: string;
    startDate: string;
    endDate: string;
    maxUsage: number;
    status: CouponStatusEnum;
}

export interface CouponFormState {
    title: string;
    code: string;
    description: string;
    discountType: CouponTypeEnum;
    discountValue: string;
    minOrderAmount: string;
    allowedPincodes: string;
    termsAndConditions: string;
    reason: string;
    startDate: string;
    endDate: string;
    maxUsage: string;
    status: CouponStatusEnum;
}

export interface CouponFormErrors {
    title?: string;
    code?: string;
    description?: string;
    discountType?: string;
    discountValue?: string;
    minOrderAmount?: string;
    termsAndConditions?: string;
    reason?: string;
    startDate?: string;
    endDate?: string;
    maxUsage?: string;
    status?: string;
}
