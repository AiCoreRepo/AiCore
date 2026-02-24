import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface PendingProduct {
    product_id: string;
    title: string;
    description: string;
    thumbnail: string | null;
    price_cents: number;
    currency: string;
    category: string | null;
    created_at: string;
    creator: {
        creator_id: string;
        store_name: string;
        verified: boolean;
    };
}

export interface ProductActionPayload {
    productId: string;
    action: 'APPROVED' | 'REJECTED';
    comment?: string;
}

/**
 * Hook to fetch pending products for approval
 */
export function usePendingProducts() {
    return useQuery<PendingProduct[]>({
        queryKey: ['admin', 'pending-products'],
        queryFn: async () => {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/admin/products/pending`,
                {
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch pending products');
            }

            return response.json();
        },
        refetchInterval: 30000, // Refetch every 30 seconds
    });
}

/**
 * Hook to approve or reject a product
 * Includes optimistic updates for instant UI feedback
 */
export function useProductAction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, action, comment }: ProductActionPayload) => {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/admin/products/${productId}/review`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ action, comment }),
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to ${action.toLowerCase()} product`);
            }

            return response.json();
        },
        // Optimistic update: Remove product from list immediately
        onMutate: async ({ productId }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['admin', 'pending-products'] });

            // Snapshot the previous value
            const previousProducts = queryClient.getQueryData<PendingProduct[]>([
                'admin',
                'pending-products',
            ]);

            // Optimistically update to remove the product
            queryClient.setQueryData<PendingProduct[]>(
                ['admin', 'pending-products'],
                (old) => old?.filter((p) => p.product_id !== productId) ?? []
            );

            // Return context with the snapshot
            return { previousProducts };
        },
        // If mutation fails, rollback to previous state
        onError: (err, variables, context) => {
            if (context?.previousProducts) {
                queryClient.setQueryData(
                    ['admin', 'pending-products'],
                    context.previousProducts
                );
            }
        },
        // Always refetch after error or success
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'pending-products'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        },
    });
}
