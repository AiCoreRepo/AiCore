import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// Use cookies for admin authentication
export const adminInventoryApi = axios.create({
  baseURL: `${API_BASE_URL}/admin/inventory`,
  withCredentials: true,
});

export const fetchInventoryDashboard = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  creator_id?: string;
  category?: string;
  stock_status?: string;
  low_threshold?: number;
  high_threshold?: number;
}) => {
  const response = await adminInventoryApi.get('', { params });
  return response.data;
};

export const fetchProductStockDetails = async (productId: string) => {
  const response = await adminInventoryApi.get(`/${productId}`);
  return response.data;
};

export const updateProductStock = async (
  productId: string,
  data: { inventory_count: number; stock_label_override?: string | null; variants?: any[] }
) => {
  const response = await adminInventoryApi.patch(`/${productId}/stock`, data);
  return response.data;
};

export const bulkUpdateStock = async (
  items: Array<{ product_id: string; inventory_count: number; stock_label_override?: string | null }>
) => {
  const response = await adminInventoryApi.patch('/bulk-update', { items });
  return response.data;
};
