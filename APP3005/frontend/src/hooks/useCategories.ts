import { useQuery } from '@tanstack/react-query';

export interface SubCategory {
    sub_category_id: string;
    name: string;
    slug: string;
    description?: string | null;
    is_active: boolean;
}

export interface Category {
    category_id: string;
    name: string;
    slug: string;
    description?: string | null;
    is_active: boolean;
    sub_categories?: SubCategory[];
}

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/**
 * Fetches active categories (with subcategories) created by the admin.
 * Public endpoint — no authentication required.
 */
export function useCategories() {
    return useQuery<Category[]>({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await fetch(`${BASE_URL}/categories`);
            if (!res.ok) {
                throw new Error(`Failed to fetch categories: ${res.status}`);
            }
            return res.json();
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        placeholderData: [],
    });
}
