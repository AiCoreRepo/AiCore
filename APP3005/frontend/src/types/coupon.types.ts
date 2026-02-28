// ============================================
// COUPON TYPES
// ============================================

import { CouponTypeEnum, CouponStatusEnum, CouponScopeTypeEnum } from '@/constants/coupon.enums';

export interface Coupon {
    id: string;
    title: string;
    code: string;
    description: string;
    discountType: CouponTypeEnum;
    discountValue: number;
    minOrderAmount: number;
    isLocationRestricted: boolean;
    allowedPincodes: string[];
    termsAndConditions: string;
    reason: string;
    startDate: string;
    endDate: string;
    maxUsage: number;
    currentUsage?: number;
    status: CouponStatusEnum;
    isOneTimePerUser?: boolean;
    isStackable?: boolean;
    scope?: {
        scopeType: CouponScopeTypeEnum;
        minPrice: number | null;
        maxPrice: number | null;
        festivalKey: string | null;
    } | null;
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
    isLocationRestricted: boolean;
    allowedPincodes: string[];
    termsAndConditions: string;
    reason: string;
    startDate: string;
    endDate: string;
    maxUsage: number;
    status: CouponStatusEnum;
    scopeType?: CouponScopeTypeEnum;
    scopeMinPrice?: number;
    scopeMaxPrice?: number;
    scopeFestivalKey?: string;
}

export interface CouponFormState {
    title: string;
    code: string;
    description: string;
    discountType: CouponTypeEnum;
    discountValue: string;
    minOrderAmount: string;
    isLocationRestricted: boolean;
    allowedPincodes: string;
    termsAndConditions: string;
    reason: string;
    startDate: string;
    endDate: string;
    maxUsage: string;
    status: CouponStatusEnum;
    scopeType: CouponScopeTypeEnum;
    scopeMinPrice: string;
    scopeMaxPrice: string;
    scopeFestivalKey: string;
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
    scopeType?: string;
    scopeMinPrice?: string;
    scopeMaxPrice?: string;
    scopeFestivalKey?: string;
}
