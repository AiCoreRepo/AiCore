import { CartItem, CartSummary } from '@/types/cart.types';
import { CART_CONFIG, CART_STORAGE_KEYS } from '@/constants/cart.constants';

/**
 * Format price in cents to display string
 */
export const formatCartPrice = (priceCents: number, currency: string): string => {
    const price = priceCents / 100;
    if (currency === 'INR') {
        return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${price.toFixed(2)}`;
};

/**
 * Calculate cart summary from items
 */
export const calculateCartSummary = (items: CartItem[]): CartSummary => {
    const subtotal_cents = items.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0);

    // Calculate tax (18% GST)
    const tax_cents = Math.round(subtotal_cents * CART_CONFIG.TAX_RATE);

    // Calculate shipping (free if above threshold)
    const shipping_cents = subtotal_cents >= CART_CONFIG.FREE_SHIPPING_THRESHOLD_CENTS
        ? 0
        : CART_CONFIG.DEFAULT_SHIPPING_CENTS;

    // Discount (placeholder - can be enhanced with coupon logic)
    const discount_cents = 0;

    const total_cents = subtotal_cents + tax_cents + shipping_cents - discount_cents;

    const currency = items.length > 0 ? items[0].currency : 'INR';

    return {
        subtotal_cents,
        tax_cents,
        shipping_cents,
        discount_cents,
        total_cents,
        currency,
        item_count: items.reduce((sum, item) => sum + item.quantity, 0),
    };
};

/**
 * Validate cart item quantity
 */
export const validateQuantity = (quantity: number, maxQuantity?: number): {
    isValid: boolean;
    error?: string;
} => {
    if (quantity < CART_CONFIG.MIN_QUANTITY) {
        return { isValid: false, error: 'Quantity must be at least 1' };
    }

    const max = maxQuantity || CART_CONFIG.MAX_QUANTITY_PER_ITEM;
    if (quantity > max) {
        return { isValid: false, error: `Maximum quantity is ${max}` };
    }

    return { isValid: true };
};

/**
 * Generate unique cart item ID
 */
export const generateCartItemId = (productId: string, size?: string, color?: string): string => {
    const parts = [productId];
    if (size) parts.push(size);
    if (color) parts.push(color);
    return parts.join('_');
};

/**
 * Check if cart item matches product (including variants)
 */
export const isMatchingCartItem = (
    item: CartItem,
    productId: string,
    size?: string,
    color?: string
): boolean => {
    return (
        item.product_id === productId &&
        item.size === size &&
        item.color === color
    );
};

/**
 * Save cart to localStorage
 */
export const saveCartToStorage = (items: CartItem[]): void => {
    try {
        localStorage.setItem(CART_STORAGE_KEYS.CART_DATA, JSON.stringify(items));
        localStorage.setItem(CART_STORAGE_KEYS.CART_TIMESTAMP, new Date().toISOString());
    } catch (error) {
        console.error('Failed to save cart to localStorage:', error);
    }
};

/**
 * Load cart from localStorage
 */
export const loadCartFromStorage = (): CartItem[] => {
    try {
        const data = localStorage.getItem(CART_STORAGE_KEYS.CART_DATA);
        if (!data) return [];
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
        return [];
    }
};

/**
 * Clear cart from localStorage
 */
export const clearCartStorage = (): void => {
    try {
        localStorage.removeItem(CART_STORAGE_KEYS.CART_DATA);
        localStorage.removeItem(CART_STORAGE_KEYS.CART_TIMESTAMP);
    } catch (error) {
        console.error('Failed to clear cart from localStorage:', error);
    }
};

/**
 * Calculate free shipping progress
 */
export const calculateShippingProgress = (subtotalCents: number): {
    percentage: number;
    remaining: number;
    isFree: boolean;
} => {
    const threshold = CART_CONFIG.FREE_SHIPPING_THRESHOLD_CENTS;
    const percentage = Math.min((subtotalCents / threshold) * 100, 100);
    const remaining = Math.max(threshold - subtotalCents, 0);
    const isFree = subtotalCents >= threshold;

    return { percentage, remaining, isFree };
};
