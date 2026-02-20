// ============================================
// PAYMENT API SERVICE
// ============================================

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ============================================
// TYPES
// ============================================

export interface InitiatePaymentResponse {
    razorpayOrderId: string;
    amount: number;         // In paise
    currency: string;
    orderId: string;
    orderNumber: string;
    keyId: string;
    prefill: {
        name: string;
        email: string;
        contact: string;
    };
}

export interface VerifyPaymentPayload {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    order_id: string;
}

export interface VerifyPaymentResponse {
    success: boolean;
    orderId: string;
    orderNumber: string;
    paymentId: string;
    message: string;
}

export interface PaymentStatusResponse {
    transactionId: string;
    gateway: string;
    gatewayOrderId: string;
    gatewayPaymentId: string | null;
    status: string;
    amountPaise: number;
    amountRupees: number;
    currency: string;
    paymentMethod: string | null;
    capturedAt: string | null;
    orderStatus: string;
    orderPaymentStatus: string;
}

// ============================================
// API METHODS
// ============================================

export const paymentApi = {
    /**
     * Step 1: Create a Razorpay order on the backend.
     * Returns the Razorpay order ID and key to open checkout.
     */
    initiatePayment: async (orderId: string): Promise<InitiatePaymentResponse> => {
        const { data } = await api.post('/payments/initiate', { orderId });
        return data;
    },

    /**
     * Step 2: After Razorpay checkout completes, verify the signature.
     * This marks the order as PAID on the backend.
     */
    verifyPayment: async (payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> => {
        const { data } = await api.post('/payments/verify', payload);
        return data;
    },

    /**
     * Get payment status for an order.
     */
    getPaymentStatus: async (orderId: string): Promise<PaymentStatusResponse> => {
        const { data } = await api.get(`/payments/status/${orderId}`);
        return data;
    },
};

export default paymentApi;
