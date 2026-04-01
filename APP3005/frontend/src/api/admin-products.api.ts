import { CreatorProduct, PaginationMeta } from './admin-creators.api';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface AdminProductListItem extends CreatorProduct {
  commission_percentage?: number;
  creator: {
    creator_id: string;
    store_name: string;
    verified: boolean;
  };
}

export interface AdminProductsResponse {
  products: AdminProductListItem[];
  pagination: PaginationMeta;
}

export async function fetchAdminProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  creator?: string;
}): Promise<AdminProductsResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.status && params.status !== 'ALL') searchParams.set('status', params.status);
  if (params.creator) searchParams.set('creator', params.creator);

  const res = await fetch(`${API_BASE}/admin/products?${searchParams.toString()}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch admin products');
  return res.json();
}

export async function updateAdminProduct(
  productId: string,
  data: { price_cents?: number; commission_percentage?: number }
): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/products/${productId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
}

export async function reviewAdminProduct(
  productId: string,
  data: { action: 'APPROVED' | 'REJECTED'; comment?: string }
): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/products/${productId}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to review product');
  return res.json();
}
