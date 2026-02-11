import { WishlistItem, WishlistSummary } from '@/types/wishlist.types';
import { WISHLIST_STORAGE_KEYS } from '@/constants/wishlist.constants';

/**
 * Calculate wishlist summary from items
 */
export const calculateWishlistSummary = (items: WishlistItem[]): WishlistSummary => {
    const totalValueCents = items.reduce(
        (sum, item) => sum + item.product.price_cents,
        0
    );

    return {
        item_count: items.length,
        total_value_cents: totalValueCents,
        currency: 'INR',
    };
};

/**
 * Save wishlist to localStorage (for guest users or offline access)
 */
export const saveWishlistToStorage = (items: WishlistItem[]): void => {
    try {
        localStorage.setItem(
            WISHLIST_STORAGE_KEYS.WISHLIST_DATA,
            JSON.stringify(items)
        );
        localStorage.setItem(
            WISHLIST_STORAGE_KEYS.WISHLIST_TIMESTAMP,
            new Date().toISOString()
        );
    } catch (error) {
        console.error('Failed to save wishlist to storage:', error);
    }
};

/**
 * Load wishlist from localStorage
 */
export const loadWishlistFromStorage = (): WishlistItem[] => {
    try {
        const data = localStorage.getItem(WISHLIST_STORAGE_KEYS.WISHLIST_DATA);
        if (data) {
            return JSON.parse(data) as WishlistItem[];
        }
    } catch (error) {
        console.error('Failed to load wishlist from storage:', error);
    }
    return [];
};

/**
 * Clear wishlist from localStorage
 */
export const clearWishlistStorage = (): void => {
    try {
        localStorage.removeItem(WISHLIST_STORAGE_KEYS.WISHLIST_DATA);
        localStorage.removeItem(WISHLIST_STORAGE_KEYS.WISHLIST_TIMESTAMP);
    } catch (error) {
        console.error('Failed to clear wishlist storage:', error);
    }
};

/**
 * Check if product is in wishlist items array
 */
export const isProductInWishlist = (
    items: WishlistItem[],
    productId: string
): boolean => {
    return items.some((item) => item.product_id === productId);
};

/**
 * Get wishlist item by product ID
 */
export const getWishlistItemByProductId = (
    items: WishlistItem[],
    productId: string
): WishlistItem | undefined => {
    return items.find((item) => item.product_id === productId);
};

/**
 * Format price for display
 */
export const formatPrice = (priceCents: number, currency: string = 'INR'): string => {
    const price = priceCents / 100;
    if (currency === 'INR') {
        return `₹${price.toLocaleString('en-IN')}`;
    }
    return `$${price.toFixed(2)}`;
};

/**
 * Get primary image URL from product images
 */
export const getPrimaryImageUrl = (
    images: Array<{ url: string; is_primary: boolean; order_index: number }>
): string | null => {
    if (!images || images.length === 0) return null;

    const primaryImage = images.find((img) => img.is_primary);
    if (primaryImage) return primaryImage.url;

    // Sort by order_index and return first
    const sorted = [...images].sort((a, b) => a.order_index - b.order_index);
    return sorted[0]?.url || null;
};
