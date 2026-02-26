// ============================================
// ADMIN COUPONS API SERVICE
// ============================================

import axios from 'axios';
import type { Coupon, CreateCouponPayload } from '@/types/coupon.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance with auth
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
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
};

export default adminCouponsApi;
