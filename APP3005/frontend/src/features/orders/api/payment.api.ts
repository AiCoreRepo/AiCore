// ============================================
// PAYMENT API SERVICE — PayU
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

/**
 * Response from POST /payments/initiate
 * Backend returns a signed PayU checkout payload.
 * The frontend must auto-submit this as an HTML form POST to `action`.
 */
export interface InitiatePaymentResponse {
    key: string;          // PayU merchant key
    txnid: string;        // Unique transaction ID
    amount: string;       // Amount as string e.g. "999.00"
    productinfo: string;  // Order description e.g. "Order #AIV-001"
    firstname: string;    // Derived from user email prefix
    email: string;
    phone: string;
    surl: string;         // Backend success URL (PayU POSTs here)
    furl: string;         // Backend failure URL (PayU POSTs here)
    hash: string;         // SHA-512 forward hash (computed server-side)
    action: string;       // PayU payment URL to POST to
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
    gatewayTxnId: string;
    gatewayPaymentId: string | null;
    status: string;
    amount: number;
    currency: string;
    paymentMethod: string | null;
    capturedAt: string | null;
    refundId: string | null;
    refundedAt: string | null;
    orderStatus: string;
    orderPaymentStatus: string;
}

// ============================================
// API METHODS
// ============================================

export const paymentApi = {
    /**
     * Step 1: Create a PayU order on the backend.
     * Returns a signed checkout payload to be submitted as an HTML form to PayU.
     */
    initiatePayment: async (orderId: string): Promise<InitiatePaymentResponse> => {
        const { data } = await api.post('/payments/initiate', { orderId });
        return data;
    },

    /**
     * Get payment status for an order.
     * Used by the success/failure pages to confirm the transaction state after redirect.
     */
    getPaymentStatus: async (orderId: string): Promise<PaymentStatusResponse> => {
        const { data } = await api.get(`/payments/status/${orderId}`);
        return data;
    },
};

export default paymentApi;
