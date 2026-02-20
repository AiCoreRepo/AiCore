// ============================================
// useRazorpay HOOK
// ============================================
import { useCallback, useEffect, useRef } from 'react';

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if ((window as any).Razorpay) { resolve(true); return; }

        const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
        if (existing) {
            existing.addEventListener('load', () => resolve(true));
            existing.addEventListener('error', () => resolve(false));
            return;
        }

        const script = document.createElement('script');
        script.src = RAZORPAY_SCRIPT_URL;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
    });
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

export interface UseRazorpayOptions {
    onSuccess: (response: RazorpaySuccessResponse) => void;
    onDismiss?: () => void;
    onError?: (error: any) => void;
}

export interface OpenRazorpayOptions {
    razorpayOrderId: string;
    amount: number;
    currency: string;
    keyId: string;
    orderNumber: string;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
        vpa?: string;   // Pre-fill UPI ID
    };
    defaultMethod?: string;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useRazorpay({ onSuccess, onDismiss, onError }: UseRazorpayOptions) {
    const instanceRef = useRef<any>(null);

    useEffect(() => {
        loadRazorpayScript();
        return () => {
            try { instanceRef.current?.close(); } catch { /* ignore */ }
        };
    }, []);

    const openCheckout = useCallback(async (opts: OpenRazorpayOptions) => {
        const loaded = await loadRazorpayScript();
        if (!loaded || !(window as any).Razorpay) {
            onError?.({ message: 'Razorpay failed to load. Please check your connection.' });
            return;
        }

        // ── Clean, minimal Razorpay options ──────────────────────────────────
        // Do NOT set config.display or method overrides — they break "More options"
        // and hide UPI. Let Razorpay render its full default modal.
        const options: Record<string, any> = {
            key: opts.keyId,
            amount: opts.amount,
            currency: opts.currency,
            name: 'Aivestire',
            description: `Order #${opts.orderNumber}`,
            image: '/logo.png',
            order_id: opts.razorpayOrderId,

            prefill: {
                name: opts.prefill?.name || '',
                email: opts.prefill?.email || '',
                contact: opts.prefill?.contact || '',
                // If user verified a UPI ID, pre-fill it in Razorpay's UPI field
                ...(opts.prefill?.vpa ? { vpa: opts.prefill.vpa } : {}),
            },

            theme: { color: '#D4AF37' },

            modal: {
                ondismiss: () => onDismiss?.(),
                confirm_close: true,
                escape: false,
                animation: true,
                // IMPORTANT: backdropclose must be false so our page
                // doesn't intercept clicks inside the Razorpay iframe
                backdropclose: false,
            },

            retry: { enabled: true, max_count: 3 },

            handler: (response: RazorpaySuccessResponse) => {
                onSuccess({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                });
            },
        };

        try {
            instanceRef.current = new (window as any).Razorpay(options);
            instanceRef.current.on('payment.failed', (response: any) => {
                onError?.(response.error);
            });
            instanceRef.current.open();
        } catch (err) {
            onError?.(err);
        }
    }, [onSuccess, onDismiss, onError]);

    return { openCheckout };
}
