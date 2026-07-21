import { useQuery } from '@tanstack/react-query';

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
        store_slug: string;
        verified: boolean;
    };
    metadata?: any;
}

export interface AvailableFilters {
    categories: string[];
    brands: string[];
    sizes: string[];
    colors: string[];
    bodyShapes: string[];
    skinTones: string[];
    ratings: string[];
    discounts: string[];
    availability: string[];
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
    availableFilters?: AvailableFilters;
}

/**
 * Hook to fetch approved products with infinite scroll pagination
 * Public endpoint - No authentication required
 */
export function usePublicProducts(
    page: number = 1,
    limit: number = 30,
    search?: string,
    categories?: string[],
    minPrice?: number,
    maxPrice?: number,
    sortBy?: string,
    sizes?: string[],
    colors?: string[],
    bodyShapes?: string[],
    skinTones?: string[],
    availability?: string[],
    audience?: string,
) {
    return useQuery<PublicProductsResponse>({
        queryKey: ['public-products', page, limit, search, categories, minPrice, maxPrice, sortBy, sizes, colors, bodyShapes, skinTones, availability, audience],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (search) params.append('search', search);
            if (categories && categories.length > 0) params.append('category', categories.join(','));
            if (minPrice !== undefined) params.append('minPrice', minPrice.toString());
            if (maxPrice !== undefined) params.append('maxPrice', maxPrice.toString());
            if (sortBy) params.append('sortBy', sortBy);
            if (sizes && sizes.length > 0) params.append('sizes', sizes.join(','));
            if (colors && colors.length > 0) params.append('colors', colors.join(','));
            if (bodyShapes && bodyShapes.length > 0) params.append('bodyShapes', bodyShapes.join(','));
            if (skinTones && skinTones.length > 0) params.append('skinTones', skinTones.join(','));
            if (availability && availability.length > 0) params.append('availability', availability.join(','));
            if (audience) params.append('audience', audience);

            const url = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/products/approved?${params}`;

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
