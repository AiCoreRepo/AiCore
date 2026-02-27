// ============================================
// ADMIN COUPONS API SERVICE
// ============================================

import axios from 'axios';
import type { Coupon, CreateCouponPayload } from '@/types/coupon.types';

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
};

export default adminCouponsApi;
