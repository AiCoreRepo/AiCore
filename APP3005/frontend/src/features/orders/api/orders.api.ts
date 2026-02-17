// ============================================
// ORDERS API SERVICE
// ============================================

import axios from 'axios';
import type {
    Order,
    OrderFilters,
    CancelOrderPayload,
    ReturnOrderPayload,
    ReplaceOrderPayload,
    CreateOrderPayload,
} from '../types/order.types';

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
// ORDER MANAGEMENT
// ============================================

export const ordersApi = {
    // Get all orders for current user
    getMyOrders: async (filters?: OrderFilters): Promise<Order[]> => {
        const params = new URLSearchParams();

        if (filters?.status && filters.status !== 'all') {
            params.append('status', filters.status);
        }
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());

        const { data } = await api.get(`/orders/my-orders?${params.toString()}`);

        return data;
    },

    // Create a new order
    createOrder: async (payload: CreateOrderPayload): Promise<Order> => {
        const { data } = await api.post('/orders', payload);
        return data;
    },

    // Get single order details
    getOrder: async (orderId: string): Promise<Order> => {
        const { data } = await api.get(`/orders/${orderId}`);
        return data;
    },

    // Get order tracking history
    getOrderTracking: async (orderId: string) => {
        const { data } = await api.get(`/orders/${orderId}/tracking`);
        return data;
    },

    // ============================================
    // CANCEL ORDER
    // ============================================

    cancelOrder: async (orderId: string, payload: CancelOrderPayload) => {
        const { data } = await api.post(`/orders/${orderId}/cancel`, payload);
        return data;
    },

    // ============================================
    // RETURN ORDER
    // ============================================

    requestReturn: async (orderId: string, payload: ReturnOrderPayload) => {
        const { data } = await api.post(`/returns/${orderId}`, payload);
        return data;
    },

    getReturnDetails: async (orderId: string) => {
        const { data } = await api.get(`/returns/order/${orderId}`);
        return data;
    },

    // ============================================
    // REPLACEMENT ORDER
    // ============================================

    requestReplacement: async (orderId: string, payload: ReplaceOrderPayload) => {
        const { data } = await api.post(`/replacements/${orderId}`, payload);
        return data;
    },

    getReplacementDetails: async (orderId: string) => {
        const { data } = await api.get(`/replacements/order/${orderId}`);
        return data;
    },

    // ============================================
    // REFUND
    // ============================================

    getRefundStatus: async (orderId: string) => {
        const { data } = await api.get(`/refunds/order/${orderId}`);
        return data;
    },
};

export default ordersApi;
