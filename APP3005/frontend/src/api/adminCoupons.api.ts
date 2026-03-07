// ============================================
// ADMIN COUPONS API SERVICE
// ============================================

import axios from 'axios';
import type { Coupon, CreateCouponPayload } from '@/types/coupon.types';

// Creator coupon shape for admin approvals
export interface PendingCreatorCoupon {
    creator_coupon_id: string;
    title: string;
    code: string;
    description?: string | null;
    discount_type: 'PERCENTAGE' | 'FLAT';
    discount_value: number;
    min_order_amount: number;
    start_date: string;
    end_date: string;
    max_usage: number;
    approval_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
    approval_note?: string | null;
    creator: {
        store_name: string;
        user: {
            email: string;
        };
    };
    product: {
        title: string;
        price_cents: number | null;
    };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance with cookie-based auth (admin uses httpOnly cookies)
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// ============================================
// COUPON MANAGEMENT
// ============================================

export const adminCouponsApi = {
    /**
     * Fetch all coupons
     */
    getCoupons: async (): Promise<Coupon[]> => {
        const { data } = await api.get('/admin/coupons');
        return data;
    },

    /**
     * Create a new coupon
     */
    createCoupon: async (payload: CreateCouponPayload): Promise<Coupon> => {
        const { data } = await api.post('/admin/coupons', payload);
        return data;
    },

    /**
     * Update an existing coupon
     */
    updateCoupon: async (id: string, payload: Partial<CreateCouponPayload>): Promise<Coupon> => {
        const { data } = await api.patch(`/admin/coupons/${id}`, payload);
        return data;
    },

    /**
     * Delete a coupon
     */
    deleteCoupon: async (id: string): Promise<{ message: string }> => {
        const { data } = await api.delete(`/admin/coupons/${id}`);
        return data;
    },

    // ============================================
    // CREATOR COUPON APPROVALS
    // ============================================

    /**
     * Fetch all pending creator coupons awaiting admin review
     */
    getPendingCreatorCoupons: async (): Promise<PendingCreatorCoupon[]> => {
        const { data } = await api.get('/admin/coupons/creator/pending');
        return data;
    },

    /**
     * Approve a creator coupon
     */
    approveCreatorCoupon: async (id: string): Promise<PendingCreatorCoupon> => {
        const { data } = await api.patch(`/admin/coupons/creator/${id}/approve`);
        return data;
    },

    /**
     * Reject a creator coupon with optional reason
     */
    rejectCreatorCoupon: async (id: string, reason?: string): Promise<PendingCreatorCoupon> => {
        const { data } = await api.patch(`/admin/coupons/creator/${id}/reject`, { reason });
        return data;
    },

    /**
     * Archive a creator coupon (e.g. after expiry or manual clean-up)
     */
    archiveCreatorCoupon: async (id: string): Promise<PendingCreatorCoupon> => {
        const { data } = await api.patch(`/admin/coupons/creator/${id}/archive`);
        return data;
    },
};

export default adminCouponsApi;
