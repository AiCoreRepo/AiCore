// ============================================
// CREATOR DASHBOARD: COUPONS API
// ============================================

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface CreatorCoupon {
    creator_coupon_id: string;
    title: string;
    code: string;
    description: string | null;
    discount_type: 'FLAT' | 'PERCENTAGE' | 'DELIVERY';
    discount_value: number;
    min_order_amount: number;
    max_usage: number;
    current_usage: number;
    status: 'ACTIVE' | 'DISABLED' | 'EXPIRED';
    approval_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
    approval_note: string | null;
    start_date: string;
    end_date: string;
    created_at: string;
    is_deleted: boolean;
    product: {
        product_id: string;
        title: string;
        price_cents: number;
        images: Array<{ image_url: string; }>;
    };
}

export interface CreateCreatorCouponParams {
    title: string;
    code: string;
    description?: string;
    discountType: 'FLAT' | 'PERCENTAGE' | 'DELIVERY';
    discountValue: number;
    minOrderAmount: number;
    startDate: string;
    endDate: string;
    maxUsage: number;
    productId: string;
}

export async function getMyCreatorCouponsApi(): Promise<CreatorCoupon[]> {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${BASE_URL}/creator-dashboard/coupons`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to fetch your coupons');
    }

    return res.json();
}

export async function createCreatorCouponApi(params: CreateCreatorCouponParams): Promise<CreatorCoupon> {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${BASE_URL}/creator-dashboard/coupons`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(params),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to create coupon');
    }

    return res.json();
}

export async function deleteCreatorCouponApi(couponId: string): Promise<void> {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${BASE_URL}/creator-dashboard/coupons/${couponId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to delete coupon');
    }
}

export interface UpdateCreatorCouponParams extends Partial<CreateCreatorCouponParams> { }

export async function updateCreatorCouponApi(couponId: string, params: UpdateCreatorCouponParams): Promise<CreatorCoupon> {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${BASE_URL}/creator-dashboard/coupons/${couponId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(params),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to update coupon');
    }

    return res.json();
}

