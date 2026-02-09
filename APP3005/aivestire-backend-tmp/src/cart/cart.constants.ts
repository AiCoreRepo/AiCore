/**
 * Cart Feature Constants
 * Centralized constants for cart operations
 */

export const CART_CONSTANTS = {
    // Quantity limits
    MIN_QUANTITY: 1,
    MAX_QUANTITY: 99,

    // Pricing (in cents)
    FREE_SHIPPING_THRESHOLD_CENTS: 50000, // ₹500
    STANDARD_SHIPPING_CENTS: 5000, // ₹50
    TAX_RATE: 0.18, // 18% GST for India

    // Default currency
    DEFAULT_CURRENCY: 'INR',

    // Product status for cart eligibility
    APPROVED_STATUS: 'APPROVED',
} as const;

export const CART_MESSAGES = {
    // Success messages
    ITEM_ADDED: 'Item added to cart successfully',
    ITEM_UPDATED: 'Cart item updated successfully',
    ITEM_REMOVED: 'Item removed from cart successfully',
    CART_CLEARED: 'Cart cleared successfully',

    // Error messages
    PRODUCT_NOT_FOUND: 'Product not found',
    PRODUCT_UNAVAILABLE: 'Product is no longer available',
    PRODUCT_NOT_APPROVED: 'Product is not available for purchase',
    CART_ITEM_NOT_FOUND: 'Cart item not found',
    INSUFFICIENT_INVENTORY: 'Only {count} items available in stock',
    MAX_QUANTITY_EXCEEDED: 'Cannot add more than 99 items',
    INVALID_QUANTITY: 'Quantity must be between 1 and 99',
} as const;

export const CART_QUERY_SELECT = {
    // Optimized product select for cart items
    PRODUCT: {
        product_id: true,
        title: true,
        slug: true,
        price_cents: true,
        currency: true,
        inventory_count: true,
        category: true,
        status: true,
        is_deleted: true,
    },

    // Optimized creator select
    CREATOR: {
        creator_id: true,
        store_name: true,
        store_slug: true,
    },

    // Optimized image select
    IMAGE: {
        image_id: true,
        url: true,
        is_primary: true,
        order_index: true,
    },
} as const;
