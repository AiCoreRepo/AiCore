import { ClothingColorValue, BodyShapeValue, SkinToneValue } from '../constants/product-hierarchy.enums';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  };
}

// ── types ─────────────────────────────────────────────────────

export interface ColorVariantPayload {
  color: ClothingColorValue;
  hex_code?: string;
  skin_tones: SkinToneValue[];
  /** base64 data URIs */
  images: string[];
  size_stocks: { size: string; stock: number }[];
}

export interface PatternPayload {
  name: string;
  body_shapes: BodyShapeValue[];
  color_variants: ColorVariantPayload[];
}

export interface CreateProductHierarchyPayload {
  title: string;
  description?: string;
  price_cents: number;
  currency?: string;
  category_id?: string;
  sub_category_id?: string;
  group_ids?: string[];
  sizes?: string[];
  age_ranges?: string[];
  patterns: PatternPayload[];
}

// ── API calls ─────────────────────────────────────────────────

export async function createProductHierarchy(payload: CreateProductHierarchyPayload) {
  const res = await fetch(`${API_BASE}/products/hierarchy`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Upload failed (${res.status})`);
  }
  return res.json();
}

export async function addPattern(productId: string, payload: PatternPayload) {
  const res = await fetch(`${API_BASE}/products/${productId}/patterns`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to add pattern');
  return res.json();
}

export async function removePattern(patternId: string) {
  const res = await fetch(`${API_BASE}/products/patterns/${patternId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to remove pattern');
  return res.json();
}

export async function addColorVariant(patternId: string, payload: ColorVariantPayload) {
  const res = await fetch(`${API_BASE}/products/patterns/${patternId}/variants`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to add color variant');
  return res.json();
}

export async function removeColorVariant(variantId: string) {
  const res = await fetch(`${API_BASE}/products/variants/${variantId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to remove color variant');
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) return [];
  return res.json();
}

// ── helpers ───────────────────────────────────────────────────

export function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
