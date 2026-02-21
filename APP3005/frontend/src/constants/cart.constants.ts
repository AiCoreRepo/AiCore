// API Endpoints
export const CART_ENDPOINTS = {
    FETCH_CART: '/cart',
    ADD_ITEM: '/cart/add',
    UPDATE_ITEM: '/cart/update',
    REMOVE_ITEM: '/cart/remove',
    CLEAR_CART: '/cart/clear',
    SYNC_CART: '/cart/sync',
} as const;

// Route Paths
export const CART_ROUTES = {
    CART_PAGE: '/cart',
    CHECKOUT: '/checkout',
} as const;

// LocalStorage Keys
export const CART_STORAGE_KEYS = {
    CART_DATA: 'aivestire_cart',
    CART_TIMESTAMP: 'aivestire_cart_timestamp',
} as const;

// User-facing Messages
export const CART_MESSAGES = {
    ADD_SUCCESS: 'Added to cart',
    ADD_ERROR: 'Failed to add item to cart',
    REMOVE_SUCCESS: 'Item removed from cart',
    REMOVE_ERROR: 'Failed to remove item',
    UPDATE_SUCCESS: 'Cart updated',
    UPDATE_ERROR: 'Failed to update cart',
    CLEAR_SUCCESS: 'Cart cleared',
    CLEAR_ERROR: 'Failed to clear cart',
    EMPTY_CART: 'Your cart is empty',
    EMPTY_CART_SUBTITLE: 'Add some beautiful pieces to get started',
    QUANTITY_LIMIT: 'Maximum quantity reached',
    QUANTITY_MIN: 'Minimum quantity is 1',
    STOCK_UNAVAILABLE: 'Item is out of stock',
    SYNC_ERROR: 'Failed to sync cart with server',
} as const;

// Configuration
export const CART_CONFIG = {
    MAX_QUANTITY_PER_ITEM: 10,
    MIN_QUANTITY: 1,
    FREE_SHIPPING_THRESHOLD_CENTS: 50000, // ₹500 or $500
    TAX_RATE: 0.18, // 18% GST for India
    DEFAULT_SHIPPING_CENTS: 5000, // ₹50 or $50
    CART_DRAWER_MAX_ITEMS: 3, // Show max 3 items in drawer
    AUTO_SAVE_DEBOUNCE_MS: 500,
} as const;

// Cart Item Status
export const CART_ITEM_STATUS = {
    AVAILABLE: 'available',
    OUT_OF_STOCK: 'out_of_stock',
    LIMITED_STOCK: 'limited_stock',
} as const;

// Animation Durations (ms)
export const CART_ANIMATIONS = {
    DRAWER_SLIDE: 300,
    BADGE_PULSE: 600,
    ITEM_REMOVE: 400,
    TOAST_DURATION: 2000,
} as const;

// ============================================================================
// Coupon & Offer Types and Constants
// ============================================================================

export const OFFER_TYPES = ['BANK_OFFER', 'CASHBACK', 'FREEBIE', 'DISCOUNT'] as const;
export type OfferType = (typeof OFFER_TYPES)[number];

export interface Coupon {
    code: string;
    discount_cents: number;
    description: string;
    min_order_cents?: number;
}

export interface Offer {
    id: string;
    title: string;
    description: string;
    terms?: string;
    offer_type: OfferType;
}

// Static Coupons (for frontend use)
export const AVAILABLE_COUPONS: Record<string, Coupon> = {
    WELCOME100: {
        code: 'WELCOME100',
        discount_cents: 10000, // ₹100
        description: 'Flat ₹100 off on first order',
        min_order_cents: 99900, // ₹999
    },
    SAVE10: {
        code: 'SAVE10',
        discount_cents: 0, // Dynamic - 10% up to ₹500
        description: '10% off up to ₹500',
    },
    FIRST50: {
        code: 'FIRST50',
        discount_cents: 5000, // ₹50
        description: 'Flat ₹50 off',
    },
} as const;

// Static Offers (for frontend use)
export const STATIC_OFFERS: Offer[] = [
    {
        id: '1',
        title: '10% Instant Discount on Canara Bank Credit Card',
        description: 'Get 10% instant discount on min spend of ₹3,500',
        terms: 'Maximum discount of ₹500. Valid once per user.',
        offer_type: 'BANK_OFFER',
    },
    {
        id: '2',
        title: '5% Unlimited Cashback on Axis Bank Credit Card',
        description: 'Get 5% cashback on all purchases',
        terms: 'No minimum order value. Valid on all products.',
        offer_type: 'CASHBACK',
    },
    {
        id: '3',
        title: 'Flat ₹100 off on first order',
        description: 'Use code WELCOME100 for flat ₹100 off',
        terms: 'Valid on orders above ₹999. New users only.',
        offer_type: 'DISCOUNT',
    },
] as const;

// Platform Fee (in cents)
export const PLATFORM_FEE_CENTS = 2300; // ₹23

// Coupon Messages
export const COUPON_MESSAGES = {
    APPLIED_SUCCESS: 'Coupon applied successfully',
    INVALID_CODE: 'Invalid coupon code',
    MIN_ORDER_NOT_MET: 'Minimum order value not met',
    REMOVED: 'Coupon removed',
    HINT: 'Try: WELCOME100, SAVE10, FIRST50',
} as const;

