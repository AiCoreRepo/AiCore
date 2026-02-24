import { useQuery } from '@tanstack/react-query';

export interface ApprovedProduct {
    product_id: string;
    title: string;
    description: string;
    price_cents: number;
    currency: string;
    thumbnail: string | null;
    created_at: string;
    approved_at: string;
    inventory_count: number;
    category: string | null;
    is_featured: boolean;
    views: number;
    creator: {
        creator_id: string;
        store_name: string;
        verified: boolean;
    };
}

export interface CollectionStats {
    total: number;
    featured: number;
    lowStock: number;
}

export interface ApprovedProductsResponse {
    products: ApprovedProduct[];
    stats: CollectionStats;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
    };
}

/**
 * Hook to fetch approved products (The Collection)
 * Supports pagination, search, and creator filtering
 */
export function useApprovedProducts(
    page: number = 1,
    search?: string,
    creatorId?: string,
) {
    return useQuery<ApprovedProductsResponse>({
        queryKey: ['admin', 'approved-products', page, search, creatorId],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });

            if (search) params.append('search', search);
            if (creatorId) params.append('creator', creatorId);

            const url = `${import.meta.env.VITE_API_URL}/admin/products/approved?${params}`;

            const response = await fetch(url, {
                credentials: 'include',
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch approved products: ${response.status}`);
            }

            const data = await response.json();
            return data;
        },
        refetchInterval: 60000, // Refetch every minute
    });
}
