import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
    getUserCart,
    getGuestCart,
    addToUserCart,
    addToGuestCart,
    updateUserCartItem,
    updateGuestCartItem,
    removeFromUserCart,
    removeFromGuestCart,
    clearUserCart,
    clearGuestCart,
    mergeCart,
    CartItemAPI,
    CartSummaryAPI,
} from '@/lib/api';

/**
 * Enterprise Cart System - Frontend Context
 * 
 * Key principles per enterprise cart spec:
 * - Backend is source of truth
 * - Frontend only mirrors cart, never owns it
 * - Frontend never merges carts
 * - On identity change → replace cart entirely
 * - localStorage is only used as a disposable cache
 */

// Types matching backend response
export interface CartItem {
    id: string; // cart_item_id or guest_cart_item_id
    product_id: string;
    title: string;
    thumbnail?: string;
    price_cents: number;
    currency: string;
    quantity: number;
    max_quantity: number;
    size?: string;
    color?: string;
    creator: {
        creator_id: string;
        store_name: string;
        store_slug: string;
    };
    added_at: string;
}

export interface CartState {
    items: CartItem[];
    summary: CartSummaryAPI;
    appliedCouponCode: string | null;
    isLoading: boolean;
    error: string | null;
    lastUpdated: string | null;
    cartSource: 'GUEST' | 'USER';
}

export interface AddToCartParams {
    product_id: string;
    title: string;
    thumbnail?: string;
    price_cents: number;
    currency: string;
    quantity?: number;
    max_quantity?: number;
    size?: string;
    color?: string;
    creator: {
        creator_id: string;
        store_name: string;
        store_slug: string;
    };
}

export interface CartContextType {
    cart: CartState;
    addToCart: (params: AddToCartParams) => Promise<void>;
    removeFromCart: (itemId: string) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;
    itemCount: number;
    isEmpty: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const DEFAULT_SUMMARY: CartSummaryAPI = {
    subtotal_cents: 0,
    tax_cents: 0,
    shipping_cents: 0,
    discount_cents: 0,
    total_cents: 0,
    currency: 'INR',
    item_count: 0,
};

/**
 * Transform backend cart item to frontend format
 */
function transformCartItem(item: CartItemAPI & { guest_cart_item_id?: string }): CartItem {
    const primaryImage = item.product.images?.find(img => img.is_primary);
    const firstImage = item.product.images?.[0];

    return {
        id: item.guest_cart_item_id || item.cart_item_id,
        product_id: item.product_id,
        title: item.product.title,
        thumbnail: primaryImage?.url || firstImage?.url,
        price_cents: item.product.price_cents,
        currency: item.product.currency,
        quantity: item.quantity,
        max_quantity: Math.min(item.product.inventory_count, 10),
        size: item.size,
        color: item.color,
        creator: item.product.creator,
        added_at: item.added_at,
    };
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const previousUserId = useRef<string | null>(null);

    const [cart, setCart] = useState<CartState>({
        items: [],
        summary: DEFAULT_SUMMARY,
        appliedCouponCode: null,
        isLoading: true,
        error: null,
        lastUpdated: null,
        cartSource: 'GUEST',
    });

    /**
     * Fetch cart from backend
     * - If user logged in → fetch user cart
     * - If guest → fetch guest cart
     */
    const fetchCart = useCallback(async (showLoading = true) => {
        if (showLoading) {
            setCart(prev => ({ ...prev, isLoading: true, error: null }));
        }

        try {
            if (user) {
                // Fetch authenticated user cart
                const response = await getUserCart();
                setCart({
                    items: response.items.map(transformCartItem),
                    summary: response.summary,
                    appliedCouponCode: response.applied_coupon_code || null,
                    isLoading: false,
                    error: null,
                    lastUpdated: new Date().toISOString(),
                    cartSource: 'USER',
                });
            } else {
                // Fetch guest cart
                try {
                    const response = await getGuestCart();
                    setCart({
                        items: response.items.map(transformCartItem),
                        summary: response.summary,
                        appliedCouponCode: response.applied_coupon_code || null,
                        isLoading: false,
                        error: null,
                        lastUpdated: new Date().toISOString(),
                        cartSource: 'GUEST',
                    });
                } catch (error) {
                    // Guest cart might not exist yet - that's fine
                    setCart({
                        items: [],
                        summary: DEFAULT_SUMMARY,
                        appliedCouponCode: null,
                        isLoading: false,
                        error: null,
                        lastUpdated: new Date().toISOString(),
                        cartSource: 'GUEST',
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
            setCart(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to load cart',
            }));
        }
    }, [user]);

    /**
     * Handle identity changes
     * Per spec: On login → merge guest cart, then fetch user cart
     *           On logout → reset to empty guest cart view
     */
    useEffect(() => {
        const currentUserId = user?.user_id || null;

        // Detect login (null → user_id)
        if (previousUserId.current === null && currentUserId !== null) {
            console.log('🔄 Login detected - triggering cart merge');
            // Call merge API then fetch cart
            mergeCart()
                .then((result) => {
                    if (result.mergeResult.merged_items > 0) {
                        toast({
                            title: 'Cart items merged!',
                            description: `${result.mergeResult.merged_items} item(s) from your guest cart have been added.`,
                            duration: 3000,
                        });
                    }
                    if (result.mergeResult.dropped_items > 0) {
                        toast({
                            variant: 'destructive',
                            title: 'Some items unavailable',
                            description: `${result.mergeResult.dropped_items} item(s) were removed because they are no longer available.`,
                            duration: 4000,
                        });
                    }
                    fetchCart();
                })
                .catch((error) => {
                    console.error('Merge failed:', error);
                    fetchCart();
                });
        }
        // Detect logout (user_id → null)
        else if (previousUserId.current !== null && currentUserId === null) {
            console.log('🚪 Logout detected - resetting cart');
            // Reset to empty guest state (per spec: logout clears UI, doesn't delete backend cart)
            setCart({
                items: [],
                summary: DEFAULT_SUMMARY,
                appliedCouponCode: null,
                isLoading: false,
                error: null,
                lastUpdated: new Date().toISOString(),
                cartSource: 'GUEST',
            });
            // Fetch fresh guest cart
            fetchCart();
        }
        // Initial load or same user
        else {
            fetchCart();
        }

        previousUserId.current = currentUserId;
    }, [user?.user_id, fetchCart, toast]);

    /**
     * Add item to cart
     */
    const addToCart = useCallback(async (params: AddToCartParams) => {
        try {
            setCart(prev => ({ ...prev, isLoading: true, error: null }));

            const request = {
                product_id: params.product_id,
                quantity: params.quantity || 1,
                size: params.size,
                color: params.color,
            };

            if (user) {
                const response = await addToUserCart(request);
                setCart({
                    items: response.items.map(transformCartItem),
                    summary: response.summary,
                    appliedCouponCode: response.applied_coupon_code || null,
                    isLoading: false,
                    error: null,
                    lastUpdated: new Date().toISOString(),
                    cartSource: 'USER',
                });
            } else {
                const response = await addToGuestCart(request);
                setCart({
                    items: response.items.map(transformCartItem),
                    summary: response.summary,
                    appliedCouponCode: response.applied_coupon_code || null,
                    isLoading: false,
                    error: null,
                    lastUpdated: new Date().toISOString(),
                    cartSource: 'GUEST',
                });
            }

            toast({
                title: 'Added to cart!',
                description: `${params.title} has been added to your cart`,
                duration: 2000,
            });

        } catch (error) {
            console.error('Error adding to cart:', error);
            setCart(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to add to cart',
            }));
            toast({
                variant: 'destructive',
                title: 'Failed to add to cart',
                description: error instanceof Error ? error.message : 'Please try again',
                duration: 3000,
            });
        }
    }, [user, toast]);

    /**
     * Remove item from cart
     */
    const removeFromCart = useCallback(async (itemId: string) => {
        try {
            setCart(prev => ({ ...prev, isLoading: true, error: null }));

            if (user) {
                const response = await removeFromUserCart(itemId);
                setCart({
                    items: response.items.map(transformCartItem),
                    summary: response.summary,
                    appliedCouponCode: response.applied_coupon_code || null,
                    isLoading: false,
                    error: null,
                    lastUpdated: new Date().toISOString(),
                    cartSource: 'USER',
                });
            } else {
                const response = await removeFromGuestCart(itemId);
                setCart({
                    items: response.items.map(transformCartItem),
                    summary: response.summary,
                    appliedCouponCode: response.applied_coupon_code || null,
                    isLoading: false,
                    error: null,
                    lastUpdated: new Date().toISOString(),
                    cartSource: 'GUEST',
                });
            }

            toast({
                title: 'Item removed',
                duration: 2000,
            });

        } catch (error) {
            console.error('Error removing from cart:', error);
            setCart(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to remove item',
            }));
            toast({
                variant: 'destructive',
                title: 'Failed to remove item',
                duration: 3000,
            });
        }
    }, [user, toast]);

    /**
     * Update item quantity
     */
    const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
        try {
            setCart(prev => ({ ...prev, isLoading: true, error: null }));

            if (user) {
                const response = await updateUserCartItem(itemId, quantity);
                setCart({
                    items: response.items.map(transformCartItem),
                    summary: response.summary,
                    appliedCouponCode: response.applied_coupon_code || null,
                    isLoading: false,
                    error: null,
                    lastUpdated: new Date().toISOString(),
                    cartSource: 'USER',
                });
            } else {
                const response = await updateGuestCartItem(itemId, quantity);
                setCart({
                    items: response.items.map(transformCartItem),
                    summary: response.summary,
                    appliedCouponCode: response.applied_coupon_code || null,
                    isLoading: false,
                    error: null,
                    lastUpdated: new Date().toISOString(),
                    cartSource: 'GUEST',
                });
            }

        } catch (error) {
            console.error('Error updating quantity:', error);
            setCart(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to update quantity',
            }));
            toast({
                variant: 'destructive',
                title: 'Failed to update quantity',
                description: error instanceof Error ? error.message : 'Please try again',
                duration: 3000,
            });
        }
    }, [user, toast]);

    /**
     * Clear entire cart
     */
    const clearCart = useCallback(async () => {
        try {
            setCart(prev => ({ ...prev, isLoading: true, error: null }));

            if (user) {
                await clearUserCart();
            } else {
                await clearGuestCart();
            }

            setCart({
                items: [],
                summary: DEFAULT_SUMMARY,
                appliedCouponCode: null,
                isLoading: false,
                error: null,
                lastUpdated: new Date().toISOString(),
                cartSource: user ? 'USER' : 'GUEST',
            });

            toast({
                title: 'Cart cleared',
                duration: 2000,
            });

        } catch (error) {
            console.error('Error clearing cart:', error);
            setCart(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to clear cart',
            }));
            toast({
                variant: 'destructive',
                title: 'Failed to clear cart',
                duration: 3000,
            });
        }
    }, [user, toast]);

    /**
     * Refresh cart (fetch from backend)
     */
    const refreshCart = useCallback(async () => {
        await fetchCart(true);
    }, [fetchCart]);

    // Computed values
    const itemCount = cart.summary.item_count;
    const isEmpty = cart.items.length === 0;

    const value: CartContextType = {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
        itemCount,
        isEmpty,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

/**
 * Custom hook to use cart context
 */
export const useCart = (): CartContextType => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
