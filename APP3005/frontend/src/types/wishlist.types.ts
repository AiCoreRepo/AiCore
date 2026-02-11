export interface WishlistItem {
    wishlist_item_id: string;
    product_id: string;
    added_at: string; // ISO timestamp

    product: {
        product_id: string;
        title: string;
        slug: string;
        price_cents: number;
        currency: string;
        inventory_count: number;
        category: string | null;
        creator: {
            creator_id: string;
            store_name: string;
            store_slug: string;
            verified: boolean;
        };
        images: Array<{
            image_id: string;
            url: string;
            is_primary: boolean;
            order_index: number;
        }>;
    };
}

export interface WishlistSummary {
    item_count: number;
    total_value_cents: number;
    currency: string;
}

export interface WishlistState {
    wishlist_id: string | null;
    items: WishlistItem[];
    summary: WishlistSummary;
    isLoading: boolean;
    error: string | null;
    lastUpdated: string | null;
}

export interface AddToWishlistParams {
    product_id: string;
    title: string;
    thumbnail: string | null;
    price_cents: number;
    currency: string;
    creator: {
        store_name: string;
        verified: boolean;
    };
}

export interface WishlistContextType {
    // State
    wishlist: WishlistState;

    // Actions
    addToWishlist: (productId: string) => Promise<void>;
    removeFromWishlist: (wishlistItemId: string) => Promise<void>;
    toggleWishlist: (productId: string) => Promise<boolean>; // returns true if added
    clearWishlist: () => Promise<void>;
    moveToCart: (wishlistItemId: string) => Promise<void>;
    refreshWishlist: () => Promise<void>;
    isInWishlist: (productId: string) => boolean;

    // Computed values
    itemCount: number;
    isEmpty: boolean;
}

export interface WishlistAPIResponse {
    wishlist_id: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    items: WishlistItem[];
    summary: WishlistSummary;
}

export interface WishlistCheckResponse {
    is_in_wishlist: boolean;
    wishlist_item_id?: string;
}

export interface WishlistToggleResponse {
    added: boolean;
    wishlist: WishlistAPIResponse;
}
