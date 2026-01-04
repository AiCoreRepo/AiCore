import { useQuery } from '@tanstack/react-query';

export interface PublicProduct {
    product_id: string;
    title: string;
    description: string;
    price_cents: number;
    currency: string;
    thumbnail: string | null;
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
 * Hook to fetch approved products (Collection page)
 * Public endpoint - No authentication required
 * Non-logged-in users can browse products
 */
export function usePublicProducts(
    page: number = 1,
    search?: string,
    category?: string,
) {
    return useQuery<PublicProductsResponse>({
        queryKey: ['public-products', page, search, category],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });

            if (search) params.append('search', search);
            if (category && category !== 'All') params.append('category', category);

            const url = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/products/approved?${params}`;

            // Public endpoint - no authentication required
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch products: ${response.status}`);
            }

            const data = await response.json();
            return data;
        },
        staleTime: 60000, // Consider data fresh for 1 minute
    });
}
