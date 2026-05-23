import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { fetchInventoryDashboard, fetchProductStockDetails, updateProductStock, bulkUpdateStock } from '../api/admin-inventory.api';

export function useAdminInventoryDashboard(params: {
  page?: number;
  limit?: number;
  search?: string;
  creator_id?: string;
  category?: string;
  stock_status?: string;
  low_threshold?: number;
  high_threshold?: number;
}) {
  return useQuery({
    queryKey: ['adminInventory', params],
    queryFn: () => fetchInventoryDashboard(params),
    placeholderData: (prev) => prev,
  });
}

export function useProductStockDetails(productId: string | null) {
  return useQuery({
    queryKey: ['adminProductStockDetails', productId],
    queryFn: () => (productId ? fetchProductStockDetails(productId) : null),
    enabled: !!productId,
  });
}

export function useUpdateProductStock() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: {
        inventory_count: number;
        stock_label_override?: string | null;
        variants?: any[];
      };
    }) => updateProductStock(productId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminInventory'] });
      queryClient.invalidateQueries({ queryKey: ['adminProductStockDetails', variables.productId] });
      // Invalidate products query as well since stock changing affects product list optionally
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      toast({
        title: 'Stock updated',
        description: 'Product inventory count successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating stock',
        description: error?.response?.data?.message || error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
}

export function useBulkUpdateStock() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (items: Array<{ product_id: string; inventory_count: number; stock_label_override?: string | null }>) =>
      bulkUpdateStock(items),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminInventory'] });
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      toast({
        title: 'Bulk Update Successful',
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Bulk Update Failed',
        description: error?.response?.data?.message || error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
}
