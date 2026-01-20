import { useInfiniteQuery } from '@tanstack/react-query';

export interface PublicProduct {
    product_id: string;
    title: string;
    description: string;
    price_cents: number;
    currency: string;
    thumbnail: string | null;
    images?: Array<{
        url: string;
        is_primary: boolean;
        order_index: number;
    }>;
    category: string | null;
    is_featured: boolean;
    likes: number;
    reviews: number;
    views: number;
    creator: {
        creator_id: string;
        store_name: string;
        verified: boolean;
    };
}

export interface PublicProductsResponse {
    products: PublicProduct[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
    };
}

/**
 * Hook to fetch approved products with infinite scroll pagination
 * Public endpoint - No authentication required
 */
export function useInfinitePublicProducts(
    search?: string,
    category?: string,
) {
    return useInfiniteQuery<PublicProductsResponse>({
        queryKey: ['infinite-public-products', search, category],
        queryFn: async ({ pageParam = 1 }) => {
            const params = new URLSearchParams({
                page: pageParam.toString(),
                limit: '20',
            });

            if (search) params.append('search', search);
            if (category && category !== 'All') params.append('category', category);

            const url = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api/products/approved?${params}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch products: ${response.status}`);
            }

            const data = await response.json();
            return data;
        },
        getNextPageParam: (lastPage) => {
            // Return next page number if there are more pages, otherwise undefined
            return lastPage.pagination.hasMore
                ? lastPage.pagination.page + 1
                : undefined;
        },
        initialPageParam: 1,
        staleTime: 60000, // Consider data fresh for 1 minute
    });
}
