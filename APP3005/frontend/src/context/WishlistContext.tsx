import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
    WishlistContextType,
    WishlistState,
    WishlistItem,
    WishlistAPIResponse,
} from '@/types/wishlist.types';
import { WISHLIST_MESSAGES } from '@/constants/wishlist.constants';
import {
    calculateWishlistSummary,
    isProductInWishlist,
    getWishlistItemByProductId,
} from '@/utils/wishlistUtils';
import { useToast } from '@/hooks/use-toast';
import {
    getWishlist as fetchWishlist,
    toggleWishlist as apiToggleWishlist,
    removeFromWishlist as apiRemoveFromWishlist,
    moveWishlistItemToCart as apiMoveToCart,
    clearWishlist as apiClearWishlist,
} from '@/lib/api';
import { useCart } from '@/context/CartContext';

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { toast } = useToast();
    const { refreshCart } = useCart();

    const [wishlist, setWishlist] = useState<WishlistState>({
        wishlist_id: null,
        items: [],
        summary: {
            item_count: 0,
            total_value_cents: 0,
            currency: 'INR',
        },
        isLoading: false,
        error: null,
        lastUpdated: null,
    });

    /**
     * Update wishlist state from API response
     */
    const updateFromApiResponse = useCallback((response: WishlistAPIResponse) => {
        setWishlist((prev) => ({
            ...prev,
            wishlist_id: response.wishlist_id,
            items: response.items,
            summary: response.summary,
            isLoading: false,
            error: null,
            lastUpdated: new Date().toISOString(),
        }));
    }, []);

    /**
     * Load wishlist from API on mount (if logged in)
     */
    useEffect(() => {
        const loadWishlist = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            try {
                setWishlist((prev) => ({ ...prev, isLoading: true }));
                const response = await fetchWishlist();
                updateFromApiResponse(response);
            } catch (error) {
                console.error('Error loading wishlist:', error);
                setWishlist((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: 'Failed to load wishlist',
                }));
            }
        };

        loadWishlist();
    }, [updateFromApiResponse]);

    /**
     * Add item to wishlist
     */
    const addToWishlist = useCallback(
        async (productId: string) => {
            try {
                setWishlist((prev) => ({ ...prev, isLoading: true, error: null }));

                const response = await apiToggleWishlist(productId);

                if (response.added) {
                    updateFromApiResponse(response.wishlist);
                    toast({
                        title: WISHLIST_MESSAGES.ADD_SUCCESS,
                        duration: 2000,
                    });
                } else {
                    updateFromApiResponse(response.wishlist);
                    toast({
                        title: WISHLIST_MESSAGES.REMOVE_SUCCESS,
                        duration: 2000,
                    });
                }
            } catch (error) {
                console.error('Error adding to wishlist:', error);
                setWishlist((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: WISHLIST_MESSAGES.ADD_ERROR,
                }));
                toast({
                    variant: 'destructive',
                    title: WISHLIST_MESSAGES.ADD_ERROR,
                    description: error instanceof Error ? error.message : 'Please try again',
                    duration: 3000,
                });
            }
        },
        [toast, updateFromApiResponse]
    );

    /**
     * Remove item from wishlist
     */
    const removeFromWishlist = useCallback(
        async (wishlistItemId: string) => {
            try {
                setWishlist((prev) => ({ ...prev, isLoading: true, error: null }));

                const response = await apiRemoveFromWishlist(wishlistItemId);
                updateFromApiResponse(response);

                toast({
                    title: WISHLIST_MESSAGES.REMOVE_SUCCESS,
                    duration: 2000,
                });
            } catch (error) {
                console.error('Error removing from wishlist:', error);
                setWishlist((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: WISHLIST_MESSAGES.REMOVE_ERROR,
                }));
                toast({
                    variant: 'destructive',
                    title: WISHLIST_MESSAGES.REMOVE_ERROR,
                    duration: 3000,
                });
            }
        },
        [toast, updateFromApiResponse]
    );

    /**
     * Toggle wishlist status for a product
     * Returns true if added, false if removed
     */
    const toggleWishlist = useCallback(
        async (productId: string): Promise<boolean> => {
            try {
                setWishlist((prev) => ({ ...prev, isLoading: true, error: null }));

                const response = await apiToggleWishlist(productId);
                updateFromApiResponse(response.wishlist);

                toast({
                    title: response.added
                        ? WISHLIST_MESSAGES.ADD_SUCCESS
                        : WISHLIST_MESSAGES.REMOVE_SUCCESS,
                    duration: 2000,
                });

                return response.added;
            } catch (error) {
                console.error('Error toggling wishlist:', error);
                setWishlist((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: 'Failed to update wishlist',
                }));
                toast({
                    variant: 'destructive',
                    title: 'Failed to update wishlist',
                    description: error instanceof Error ? error.message : 'Please try again',
                    duration: 3000,
                });
                throw error;
            }
        },
        [toast, updateFromApiResponse]
    );

    /**
     * Clear entire wishlist
     */
    const clearWishlist = useCallback(async () => {
        try {
            setWishlist((prev) => ({ ...prev, isLoading: true, error: null }));

            await apiClearWishlist();

            setWishlist((prev) => ({
                ...prev,
                items: [],
                summary: {
                    item_count: 0,
                    total_value_cents: 0,
                    currency: 'INR',
                },
                isLoading: false,
                lastUpdated: new Date().toISOString(),
            }));

            toast({
                title: WISHLIST_MESSAGES.CLEAR_SUCCESS,
                duration: 2000,
            });
        } catch (error) {
            console.error('Error clearing wishlist:', error);
            setWishlist((prev) => ({
                ...prev,
                isLoading: false,
                error: WISHLIST_MESSAGES.CLEAR_ERROR,
            }));
            toast({
                variant: 'destructive',
                title: WISHLIST_MESSAGES.CLEAR_ERROR,
                duration: 3000,
            });
        }
    }, [toast]);

    /**
     * Move item from wishlist to cart
     */
    const moveToCart = useCallback(
        async (wishlistItemId: string) => {
            try {
                setWishlist((prev) => ({ ...prev, isLoading: true, error: null }));

                await apiMoveToCart(wishlistItemId);

                // Refresh wishlist
                const response = await fetchWishlist();
                updateFromApiResponse(response);

                // Refresh cart
                await refreshCart();

                toast({
                    title: WISHLIST_MESSAGES.MOVE_TO_CART_SUCCESS,
                    duration: 2000,
                });
            } catch (error) {
                console.error('Error moving to cart:', error);
                setWishlist((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: WISHLIST_MESSAGES.MOVE_TO_CART_ERROR,
                }));
                toast({
                    variant: 'destructive',
                    title: WISHLIST_MESSAGES.MOVE_TO_CART_ERROR,
                    description: error instanceof Error ? error.message : 'Please try again',
                    duration: 3000,
                });
            }
        },
        [toast, updateFromApiResponse, refreshCart]
    );

    /**
     * Refresh wishlist from API
     */
    const refreshWishlist = useCallback(async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        try {
            setWishlist((prev) => ({ ...prev, isLoading: true, error: null }));
            const response = await fetchWishlist();
            updateFromApiResponse(response);
        } catch (error) {
            console.error('Error refreshing wishlist:', error);
            setWishlist((prev) => ({
                ...prev,
                isLoading: false,
                error: 'Failed to refresh wishlist',
            }));
        }
    }, [updateFromApiResponse]);

    /**
     * Check if product is in wishlist
     */
    const isInWishlist = useCallback(
        (productId: string): boolean => {
            return isProductInWishlist(wishlist.items, productId);
        },
        [wishlist.items]
    );

    // Computed values
    const itemCount = wishlist.summary.item_count;
    const isEmpty = wishlist.items.length === 0;

    const value: WishlistContextType = useMemo(
        () => ({
            wishlist,
            addToWishlist,
            removeFromWishlist,
            toggleWishlist,
            clearWishlist,
            moveToCart,
            refreshWishlist,
            isInWishlist,
            itemCount,
            isEmpty,
        }),
        [
            wishlist,
            addToWishlist,
            removeFromWishlist,
            toggleWishlist,
            clearWishlist,
            moveToCart,
            refreshWishlist,
            isInWishlist,
            itemCount,
            isEmpty,
        ]
    );

    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

/**
 * Custom hook to use wishlist context
 */
export const useWishlist = (): WishlistContextType => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};
