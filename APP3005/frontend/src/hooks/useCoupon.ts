// ============================================
// useCoupon HOOK
// Session-aware coupon state management
//
// Flow (like Myntra / Flipkart):
//   • Coupon persists across checkout pages: /cart ↔ /payment
//   • Coupon is auto-removed when user leaves the checkout flow
//     (e.g. navigates to /, /collection, etc.)
//   • State is kept in sessionStorage (cleared on tab close)
//   • DB coupon is cleared when leaving the checkout flow
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
    applyCouponApi,
    removeCouponApi,
    getAvailableCouponsApi,
    type CouponApplyResponse,
    type AvailableCoupon,
} from '@/api/coupons.api';
import { useCart } from '@/context/CartContext';

// Pages that are part of the checkout flow
const CHECKOUT_ROUTES = ['/cart', '/payment', '/payment-success'];
const SESSION_KEY = 'aivestire_applied_coupon';

function isCheckoutRoute(pathname: string): boolean {
    return CHECKOUT_ROUTES.some(r => pathname.startsWith(r));
}

// ── Session helpers ──

function saveCouponToSession(coupon: CouponApplyResponse): void {
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(coupon));
    } catch { /* quota exceeded — ignore */ }
}

function loadCouponFromSession(): CouponApplyResponse | null {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function clearCouponSession(): void {
    sessionStorage.removeItem(SESSION_KEY);
}

// ── Hook ──

export interface UseCouponReturn {
    appliedCoupon: CouponApplyResponse | null;
    isApplying: boolean;
    error: string | null;
    applyCoupon: (code: string) => Promise<boolean>;
    removeCoupon: () => void;
    discountCents: number;
    freeShipping: boolean;
    availableCoupons: AvailableCoupon[];
    isLoadingCoupons: boolean;
    fetchAvailableCoupons: () => Promise<void>;
}

export function useCoupon(): UseCouponReturn {
    const { refreshCart } = useCart();
    const location = useLocation();
    const prevPathRef = useRef(location.pathname);

    // Restore from session on first mount
    const [appliedCoupon, setAppliedCoupon] = useState<CouponApplyResponse | null>(
        () => loadCouponFromSession()
    );
    const [isApplying, setIsApplying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
    const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);

    // ── Route change listener ──
    // When user navigates AWAY from the checkout flow, clear the coupon.
    useEffect(() => {
        const prev = prevPathRef.current;
        const curr = location.pathname;
        prevPathRef.current = curr;

        // If we were in checkout and now we're NOT → clear coupon
        if (isCheckoutRoute(prev) && !isCheckoutRoute(curr)) {
            clearCouponSession();
            setAppliedCoupon(null);
            setError(null);
            // Fire-and-forget: clear coupon from DB
            removeCouponApi().catch(() => { });
        }
    }, [location.pathname]);

    // ── Available coupons ──
    const fetchAvailableCoupons = useCallback(async () => {
        setIsLoadingCoupons(true);
        try {
            const coupons = await getAvailableCouponsApi();
            setAvailableCoupons(coupons);
        } catch {
            setAvailableCoupons([]);
        } finally {
            setIsLoadingCoupons(false);
        }
    }, []);

    // ── Apply ──
    const applyCoupon = useCallback(async (code: string): Promise<boolean> => {
        if (!code.trim()) {
            setError('Please enter a coupon code');
            return false;
        }

        setIsApplying(true);
        setError(null);

        try {
            const response = await applyCouponApi(code);

            if (response.valid) {
                setAppliedCoupon(response);
                saveCouponToSession(response);
                setError(null);
                await refreshCart();
                return true;
            } else {
                setError(response.message || 'Coupon is not valid');
                setAppliedCoupon(null);
                clearCouponSession();
                return false;
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to apply coupon';
            setError(message);
            setAppliedCoupon(null);
            clearCouponSession();
            return false;
        } finally {
            setIsApplying(false);
        }
    }, [refreshCart]);

    // ── Remove ──
    const removeCoupon = useCallback(async () => {
        setIsApplying(true);
        try {
            await removeCouponApi();
            setAppliedCoupon(null);
            clearCouponSession();
            setError(null);
            await refreshCart();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove coupon');
        } finally {
            setIsApplying(false);
        }
    }, [refreshCart]);

    return {
        appliedCoupon,
        isApplying,
        error,
        applyCoupon,
        removeCoupon,
        discountCents: appliedCoupon?.discountAmount ?? 0,
        freeShipping: appliedCoupon?.freeShipping ?? false,
        availableCoupons,
        isLoadingCoupons,
        fetchAvailableCoupons,
    };
}
