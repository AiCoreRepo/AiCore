// ============================================
// COUPON APPLY RESPONSE DTO
// ============================================

export class CouponApplyResponseDto {
    valid: boolean;
    couponId: string;
    code: string;
    title: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;  // calculated discount in cents
    freeShipping: boolean;
    message: string;

    // Scope info (optional — for frontend display)
    scopeType?: string;
    scopeMinPrice?: number | null;
    scopeMaxPrice?: number | null;
    festivalKey?: string | null;
}
