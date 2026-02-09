// API Endpoints
export const WISHLIST_ENDPOINTS = {
    FETCH_WISHLIST: '/wishlist',
    ADD_ITEM: '/wishlist/items',
    REMOVE_ITEM: '/wishlist/items', // + /:wishlistItemId
    REMOVE_BY_PRODUCT: '/wishlist/product', // + /:productId
    TOGGLE: '/wishlist/toggle', // + /:productId
    CHECK: '/wishlist/check', // + /:productId
    MOVE_TO_CART: '/wishlist/items', // + /:wishlistItemId/move-to-cart
    CLEAR_WISHLIST: '/wishlist',
    SUMMARY: '/wishlist/summary',
} as const;

// Route Paths
export const WISHLIST_ROUTES = {
    WISHLIST_PAGE: '/wishlist',
} as const;

// LocalStorage Keys
export const WISHLIST_STORAGE_KEYS = {
    WISHLIST_DATA: 'aivestire_wishlist',
    WISHLIST_TIMESTAMP: 'aivestire_wishlist_timestamp',
} as const;

// User-facing Messages
export const WISHLIST_MESSAGES = {
    ADD_SUCCESS: 'Product added in wishlist successfully',
    ADD_ERROR: 'Failed to add to wishlist',
    REMOVE_SUCCESS: 'Removed from wishlist',
    REMOVE_ERROR: 'Failed to remove from wishlist',
    CLEAR_SUCCESS: 'Wishlist cleared',
    CLEAR_ERROR: 'Failed to clear wishlist',
    MOVE_TO_CART_SUCCESS: 'Moved to cart',
    MOVE_TO_CART_ERROR: 'Failed to move to cart',
    EMPTY_WISHLIST: 'Your wishlist is empty',
    EMPTY_WISHLIST_SUBTITLE: 'Save items you love to your wishlist',
    ALREADY_IN_WISHLIST: 'Already in wishlist',
    OUT_OF_STOCK: 'This item is out of stock',
    LOGIN_REQUIRED: 'Please login to save items',
} as const;

// Configuration
export const WISHLIST_CONFIG = {
    MAX_ITEMS: 100,
    TOAST_DURATION: 2000,
    BADGE_ANIMATION_DURATION: 600,
} as const;

// Animation Durations (ms)
export const WISHLIST_ANIMATIONS = {
    HEART_FILL: 300,
    BADGE_PULSE: 600,
    ITEM_REMOVE: 400,
    TOAST_DURATION: 2000,
} as const;
