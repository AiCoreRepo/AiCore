// ── Types ─────────────────────────────────────────────────────────────────────

export type StockLabel = 'OUT_OF_STOCK' | 'LOW' | 'OK';

export interface SizeStockItem {
  size_stock_id: string;
  size: string;
  stock: number;
  stock_label: StockLabel;
}

export interface ColorVariantItem {
  variant_id: string;
  color: string;
  hex_code: string | null;
  display_order: number;
  primary_image: string | null;
  total_stock: number;
  stock_label: StockLabel;
  size_stocks: SizeStockItem[];
}

export interface PatternItem {
  pattern_id: string;
  name: string;
  body_shapes: string[];
  display_order: number;
  color_variants: ColorVariantItem[];
}

export interface StockProduct {
  product_id: string;
  title: string;
  status: 'Active' | 'Pending' | 'Draft' | 'Rejected';
  primary_image: string | null;
  price_cents: number;
  currency: string;
  inventory_count: number;
  total_stock: number;
  stock_label: StockLabel;
  category_name: string | null;
  sub_category_name: string | null;
  created_at: string;
  updated_at: string | null;
  patterns: PatternItem[];
}

export interface UpdateSizeStockResponse {
  size_stock_id: string;
  variant_id: string;
  size: string;
  stock: number;
  stock_label: StockLabel;
  product_inventory_count: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message =
      Array.isArray(err?.message)
        ? err.message.join(', ')
        : err?.message ?? `Request failed (${res.status})`;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// ── API Calls ─────────────────────────────────────────────────────────────────

/**
 * GET /creator-dashboard/stock-management
 * Returns all creator products with their full Pattern → ColorVariant → SizeStock tree.
 */
export async function fetchCreatorStockManagement(): Promise<StockProduct[]> {
  const res = await fetch(`${API_BASE}/creator-dashboard/stock-management`, {
    method: 'GET',
    headers: authHeaders(),
  });
  return handleResponse<StockProduct[]>(res);
}

/**
 * PATCH /creator-dashboard/stock-management/:variantId/sizes/:size
 * Updates the stock for a single size within a colour variant.
 * The size value in the URL is URI-encoded to handle values like "XL/2XL".
 */
export async function updateSizeStock(
  variantId: string,
  size: string,
  stock: number,
): Promise<UpdateSizeStockResponse> {
  const res = await fetch(
    `${API_BASE}/creator-dashboard/stock-management/${variantId}/sizes/${encodeURIComponent(size)}`,
    {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ stock }),
    },
  );
  return handleResponse<UpdateSizeStockResponse>(res);
}
