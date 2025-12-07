import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to toggle product featured status
 */
export function useFeatureToggle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, isFeatured }: { productId: string; isFeatured: boolean }) => {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/admin/products/${productId}/feature`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ is_featured: isFeatured }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to toggle feature status');
            }

            return response.json();
        },
        onSuccess: () => {
            // Invalidate and refetch approved products
            queryClient.invalidateQueries({ queryKey: ['admin', 'approved-products'] });
        },
    });
}

/**
 * Hook to update product stock
 */
export function useStockUpdate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, inventoryCount }: { productId: string; inventoryCount: number }) => {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/admin/products/${productId}/stock`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ inventory_count: inventoryCount }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update stock');
            }

            return response.json();
        },
        onSuccess: () => {
            // Invalidate and refetch approved products
            queryClient.invalidateQueries({ queryKey: ['admin', 'approved-products'] });
        },
    });
}

/**
 * Hook to delete product from collection
 */
export function useProductDelete() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (productId: string) => {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/admin/products/${productId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to delete product');
            }

            return response.json();
        },
        onSuccess: () => {
            // Invalidate and refetch approved products
            queryClient.invalidateQueries({ queryKey: ['admin', 'approved-products'] });
        },
    });
}
