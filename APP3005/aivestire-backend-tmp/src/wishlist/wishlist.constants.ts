/**
 * Wishlist Feature Constants
 * Centralized constants for wishlist operations
 */

export const WISHLIST_CONSTANTS = {
  // Limits
  MAX_ITEMS: 100,

  // Product status for wishlist eligibility
  APPROVED_STATUS: 'APPROVED',
} as const;

export const WISHLIST_MESSAGES = {
  // Success messages
  ITEM_ADDED: 'Item added to wishlist',
  ITEM_REMOVED: 'Item removed from wishlist',
  WISHLIST_CLEARED: 'Wishlist cleared successfully',
  MOVED_TO_CART: 'Item moved to cart',

  // Error messages
  PRODUCT_NOT_FOUND: 'Product not found',
  PRODUCT_UNAVAILABLE: 'Product is no longer available',
  PRODUCT_NOT_APPROVED: 'Product is not available',
  WISHLIST_ITEM_NOT_FOUND: 'Wishlist item not found',
  ALREADY_IN_WISHLIST: 'Product is already in your wishlist',
  MAX_ITEMS_EXCEEDED: 'Wishlist is full (max 100 items)',
  PRODUCT_OUT_OF_STOCK: 'Product is out of stock',
} as const;

export const WISHLIST_QUERY_SELECT = {
  // Optimized product select for wishlist items
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
    verified: true,
  },

  // Optimized image select
  IMAGE: {
    image_id: true,
    url: true,
    is_primary: true,
    order_index: true,
  },
} as const;
