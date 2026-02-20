// ============================================
// RAZORPAY CHECKOUT TYPE DECLARATIONS
// ============================================
// Razorpay is loaded via <script> tag, so we declare its global types here.

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    image?: string;
    order_id: string;
    handler: (response: RazorpayPaymentResponse) => void;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    notes?: Record<string, string>;
    theme?: {
        color?: string;
        backdrop_color?: string;
        hide_topbar?: boolean;
    };
    modal?: {
        ondismiss?: () => void;
        confirm_close?: boolean;
        escape?: boolean;
        animation?: boolean;
    };
    retry?: {
        enabled?: boolean;
        max_count?: number;
    };
    timeout?: number;
}

interface RazorpayPaymentResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

interface RazorpayInstance {
    open(): void;
    close(): void;
    on(event: string, callback: (response: any) => void): void;
}

interface RazorpayConstructor {
    new(options: RazorpayOptions): RazorpayInstance;
}

declare global {
    interface Window {
        Razorpay: RazorpayConstructor;
    }
}

export { };
