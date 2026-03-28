/**
 * Admin Creators API
 * Repository pattern – all API calls in one place.
 */

import { CreatorStatusFilter } from '../constants/creator-management.constants';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CreatorListItem {
  creator_id: string;
  store_name: string;
  store_slug: string;
  about: string | null;
  verified: boolean;
  created_at: string;
  is_active: boolean;
  total_products: number;
  user: {
    user_id: string;
    email: string;
    status: string;
    last_login: string | null;
    phone?: string | null;
  };
}

export interface CreatorDetail extends CreatorListItem {
  limits: {
    max_products: number;
    max_images_per_product: number;
  } | null;
  product_summary: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  total_sales?: number;
  total_sales_formatted?: string;
}

export interface CreatorProduct {
  product_id: string;
  title: string;
  description: string | null;
  status: string;
  price_cents: number;
  currency: string;
  category: string | null;
  created_at: string;
  thumbnail: string | null;
  views: number;
  inventory_count: number;
  is_featured: boolean;
  sales?: {
    units_sold: number;
    revenue_generated: number;
    revenue_formatted?: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CreatorsListResponse {
  creators: CreatorListItem[];
  pagination: PaginationMeta;
}

export interface CreatorProductsResponse {
  products: CreatorProduct[];
  pagination: PaginationMeta;
}

// ── API Functions ─────────────────────────────────────────────────────────────

export async function fetchAdminCreators(params: {
  search?: string;
  status?: CreatorStatusFilter;
  page?: number;
  limit?: number;
}): Promise<CreatorsListResponse> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.status && params.status !== CreatorStatusFilter.ALL) {
    searchParams.set('status', params.status);
  }
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const res = await fetch(
    `${API_BASE}/admin/creators?${searchParams.toString()}`,
    { credentials: 'include' },
  );
  if (!res.ok) throw new Error('Failed to fetch creators');
  return res.json();
}

export async function fetchAdminCreatorById(
  creatorId: string,
): Promise<CreatorDetail> {
  const res = await fetch(`${API_BASE}/admin/creators/${creatorId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch creator');
  return res.json();
}

export async function fetchAdminCreatorProducts(
  creatorId: string,
  params: { status?: string; page?: number; limit?: number },
): Promise<CreatorProductsResponse> {
  const searchParams = new URLSearchParams();
  if (params.status && params.status !== 'ALL') {
    searchParams.set('status', params.status);
  }
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const res = await fetch(
    `${API_BASE}/admin/creators/${creatorId}/products?${searchParams.toString()}`,
    { credentials: 'include' },
  );
  if (!res.ok) throw new Error("Failed to fetch creator's products");
  return res.json();
}

export async function toggleAdminCreatorStatus(
  creatorId: string,
  action: 'ACTIVE' | 'INACTIVE',
): Promise<{ creator_id: string; is_active: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/admin/creators/${creatorId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error('Failed to update creator status');
  return res.json();
}
