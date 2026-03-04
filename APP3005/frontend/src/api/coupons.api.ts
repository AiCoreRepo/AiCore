// ============================================
// USER-FACING COUPON API SERVICE
// ============================================

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface CouponApplyResponse {
    valid: boolean;
    couponId: string;
    code: string;
    title: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;  // discount in cents
    freeShipping: boolean;
    message: string;
    scopeType?: string;
    scopeMinPrice?: number | null;
    scopeMaxPrice?: number | null;
    festivalKey?: string | null;
}

export interface CouponValidateResponse {
    valid: boolean;
    message: string;
    title?: string;
    discountType?: string;
    discountValue?: number;
}

/**
 * Apply a coupon code to the user's cart.
 * The backend fetches the cart internally and calculates the discount.
 */
export async function applyCouponApi(code: string): Promise<CouponApplyResponse> {
    const token = localStorage.getItem('access_token');
    if (!token) {
        throw new Error('Please login to apply coupons');
    }

    const res = await fetch(`${BASE_URL}/coupons/apply`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || 'Failed to apply coupon');
    }

    return data;
}

/**
 * Quick validate a coupon code without full cart context.
 */
export async function validateCouponApi(code: string): Promise<CouponValidateResponse> {
    const token = localStorage.getItem('access_token');
    if (!token) {
        throw new Error('Please login to validate coupons');
    }

    const res = await fetch(`${BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || 'Failed to validate coupon');
    }

    return data;
}

/**
 * Remove an applied coupon from the user's cart.
 */
export async function removeCouponApi(): Promise<{ success: true; message: string }> {
    const token = localStorage.getItem('access_token');
    if (!token) {
        throw new Error('Please login to modify coupons');
    }

    const res = await fetch(`${BASE_URL}/coupons/remove`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || 'Failed to remove coupon');
    }

    return data;
}

// ============================================
// AVAILABLE COUPONS (for drawer)
// ============================================

export interface AvailableCoupon {
    code: string;
    title: string;
    description: string;
    discountType: string;
    discountValue: number;
    discountLabel: string;
    minOrderAmount: number;
    scopeType: string;
    scopeLabel?: string;
    isEligible: boolean;
    isFullyUsed: boolean;
    usageInfo: string;       // e.g. "3/5 used"
    ineligibleReason?: string;
    expiresAt: string;
}

/**
 * Fetch all available coupons for the coupon drawer.
 */
export async function getAvailableCouponsApi(): Promise<AvailableCoupon[]> {
    const token = localStorage.getItem('access_token');
    if (!token) {
        return []; // Guest users can't see coupons
    }

    const res = await fetch(`${BASE_URL}/coupons/available`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        return [];
    }

    return res.json();
}
