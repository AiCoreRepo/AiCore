export interface CartItem {
    id: string; // Unique cart item ID
    product_id: string;
    title: string;
    thumbnail: string | null;
    price_cents: number;
    currency: string;
    quantity: number;
    max_quantity?: number; // Stock limit

    // Product variants
    size?: string;
    color?: string;

    // Creator info
    creator: {
        store_name: string;
        verified: boolean;
    };

    // Additional metadata
    added_at: string; // ISO timestamp
}

export interface CartSummary {
    subtotal_cents: number;
    tax_cents: number;
    shipping_cents: number;
    discount_cents: number;
    total_cents: number;
    currency: string;
    item_count: number;
}

export interface CartState {
    items: CartItem[];
    summary: CartSummary;
    isLoading: boolean;
    error: string | null;
    lastUpdated: string | null;
}

export interface AddToCartParams {
    product_id: string;
    title: string;
    thumbnail: string | null;
    price_cents: number;
    currency: string;
    quantity?: number;
    size?: string;
    color?: string;
    creator: {
        store_name: string;
        verified: boolean;
    };
    max_quantity?: number;
}

export interface UpdateCartItemParams {
    id: string;
    quantity: number;
}

export interface CartContextType {
    // State
    cart: CartState;

    // Actions
    addToCart: (params: AddToCartParams) => Promise<void>;
    removeFromCart: (itemId: string) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;

    // Computed values
    itemCount: number;
    isEmpty: boolean;
}

export interface CartAPIResponse {
    success: boolean;
    data?: CartState;
    message?: string;
    error?: string;
}

// Re-export Address types from constants (single source of truth)
export type {
    AddressType,
    Address,
    CreateAddressParams,
    UpdateAddressParams,
} from '@/constants/address.constants';

// Re-export Coupon and Offer types from constants (single source of truth)
export type {
    OfferType,
    Coupon,
    Offer,
} from '@/constants/cart.constants';


