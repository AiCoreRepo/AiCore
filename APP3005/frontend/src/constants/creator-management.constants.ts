/**
 * Creator Management Constants & Enums
 * Admin Dashboard – Creator (Artisan) Management Feature
 */

// ── Status Enums ─────────────────────────────────────────────────────────────

export enum CreatorStatusFilter {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum ProductStatusFilter {
  ALL = 'ALL',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DRAFT = 'DRAFT',
}

// ── Query Keys ────────────────────────────────────────────────────────────────

export const CREATOR_QUERY_KEYS = {
  ALL: ['admin', 'creators'] as const,
  list: (params: Record<string, string>) =>
    ['admin', 'creators', 'list', params] as const,
  detail: (id: string) => ['admin', 'creators', id] as const,
  products: (id: string, params?: Record<string, string>) =>
    ['admin', 'creators', id, 'products', params] as const,
};

// ── Messages ──────────────────────────────────────────────────────────────────

export const CREATOR_MESSAGES = {
  ACTIVATE_CONFIRM: (name: string) =>
    `Are you sure you want to activate "${name}"? They will regain full access to upload and sell products.`,
  DEACTIVATE_CONFIRM: (name: string) =>
    `Are you sure you want to deactivate "${name}"? Their products will be hidden from the storefront and they cannot upload new products.`,
  ACTIVATE_SUCCESS: 'Creator activated successfully.',
  DEACTIVATE_SUCCESS: 'Creator deactivated successfully.',
  ACTIVATE_ERROR: 'Failed to activate creator. Please try again.',
  DEACTIVATE_ERROR: 'Failed to deactivate creator. Please try again.',
  LOAD_ERROR: 'Failed to load creators.',
  PROFILE_LOAD_ERROR: 'Failed to load creator profile.',
} as const;

// ── Pagination ────────────────────────────────────────────────────────────────

export const CREATOR_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
} as const;

// ── Status Badge Config ───────────────────────────────────────────────────────

export const PRODUCT_STATUS_BADGE = {
  APPROVED: { label: 'Approved', className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  PENDING: { label: 'Pending', className: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  REJECTED: { label: 'Rejected', className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  DRAFT: { label: 'Draft', className: 'bg-neutral-500/20 text-neutral-400 border border-neutral-500/30' },
  ARCHIVED: { label: 'Archived', className: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' },
} as const;
