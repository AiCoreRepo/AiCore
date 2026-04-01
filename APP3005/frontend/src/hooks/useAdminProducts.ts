import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAdminProducts, updateAdminProduct, reviewAdminProduct } from '../api/admin-products.api';
import { useToast } from './use-toast';

export function useAdminProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  creator?: string;
}) {
  return useQuery({
    queryKey: ['adminProducts', params],
    queryFn: () => fetchAdminProducts(params),
    placeholderData: (prev) => prev,
  });
}

export function useUpdateAdminProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: { price_cents?: number; commission_percentage?: number } }) =>
      updateAdminProduct(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      toast({
        title: 'Product updated',
        description: 'Product price/commission successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating product',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
}

export function useReviewAdminProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ productId, action, comment }: { productId: string; action: 'APPROVED' | 'REJECTED'; comment?: string }) =>
      reviewAdminProduct(productId, { action, comment }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      toast({
        title: `Product ${variables.action.toLowerCase()}`,
        description: `Product has been ${variables.action.toLowerCase()} successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error reviewing product',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
}
