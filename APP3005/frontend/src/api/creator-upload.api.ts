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
  stock: number;
  skin_tones: SkinToneValue[];
  /** base64 data URIs */
  images: string[];
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

export interface ColorVariantFilePayload {
  color: ClothingColorValue;
  hex_code?: string;
  stock: number;
  skin_tones: SkinToneValue[];
  images: File[];
}

export interface PatternFilePayload {
  name: string;
  body_shapes: BodyShapeValue[];
  color_variants: ColorVariantFilePayload[];
}

export type CreateProductHierarchyFilePayload = Omit<
  CreateProductHierarchyPayload,
  'patterns'
> & {
  patterns: PatternFilePayload[];
};

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

export async function createProductHierarchyFromFiles(
  payload: CreateProductHierarchyFilePayload,
) {
  const formData = new FormData();
  const jsonPayload: CreateProductHierarchyPayload = {
    ...payload,
    patterns: payload.patterns.map((pattern, patternIndex) => ({
      ...pattern,
      color_variants: pattern.color_variants.map((variant, variantIndex) => ({
        color: variant.color,
        hex_code: variant.hex_code,
        stock: variant.stock,
        skin_tones: variant.skin_tones,
        images: variant.images.map((file, imageIndex) => {
          const key = `image_${patternIndex}_${variantIndex}_${imageIndex}`;
          formData.append(key, file, file.name);
          return key;
        }),
      })),
    })),
  };

  formData.append('payload', JSON.stringify(jsonPayload));

  const res = await fetch(`${API_BASE}/products/hierarchy/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
    body: formData,
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
