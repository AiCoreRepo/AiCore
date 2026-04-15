// ============================================
// FRONTEND REFUND CONSTANTS
// ============================================
// Single source of truth — mirrors backend refund.constants.ts
// Used by: hooks, UI components, formatters.
// ============================================

import type { RefundStatus } from '../types/order.types';

// ─── Status display config ──────────────────────────────────────────────────

export const REFUND_STATUS_CONFIG: Record<
  RefundStatus,
  { label: string; color: string; bgColor: string; borderColor: string; icon: string }
> = {
  INITIATED:      { label: 'Refund Initiated',  color: '#10B981', bgColor: '#ECFDF5', borderColor: '#6EE7B7', icon: '💰' },
  PENDING_REVIEW: { label: 'Refund Initiated',  color: '#10B981', bgColor: '#ECFDF5', borderColor: '#6EE7B7', icon: '💰' },
  PROCESSING:     { label: 'Processing Refund', color: '#8B5CF6', bgColor: '#F5F3FF', borderColor: '#C4B5FD', icon: '⏳' },
  COMPLETED:      { label: 'Refund Completed',  color: '#059669', bgColor: '#D1FAE5', borderColor: '#6EE7B7', icon: '✅' },
  FAILED:         { label: 'Refund Failed',     color: '#EF4444', bgColor: '#FEE2E2', borderColor: '#FCA5A5', icon: '❌' },
  REJECTED:       { label: 'Refund Rejected',   color: '#EF4444', bgColor: '#FEE2E2', borderColor: '#FCA5A5', icon: '🚫' },
  ARCHIVED:       { label: 'Refund Archived',   color: '#6B7280', bgColor: '#F3F4F6', borderColor: '#D1D5DB', icon: '📁' },
};

// ─── User-facing messages ───────────────────────────────────────────────────

export const REFUND_STATUS_MESSAGES: Record<RefundStatus, string> = {
  INITIATED:      'Refund request received and is under review',
  PENDING_REVIEW: 'Refund request received and is under review',
  PROCESSING:     'Refund is being processed via PayU',
  COMPLETED:      'Refund completed — amount credited to your wallet',
  FAILED:         'Refund processing failed. Our team will assist you shortly',
  REJECTED:       'Refund request was reviewed and rejected',
  ARCHIVED:       'Refund request has been archived',
};

// ─── SSE event name ─────────────────────────────────────────────────────────

export const REFUND_SSE_EVENT = 'refund-update';

// ─── Terminal states (no further change expected) ───────────────────────────

export const REFUND_TERMINAL_STATES: RefundStatus[] = ['COMPLETED', 'FAILED', 'REJECTED'];

// ─── Helper ─────────────────────────────────────────────────────────────────

export const formatRefundStatus = (status?: string | null): string => {
  if (!status) return '';
  return REFUND_STATUS_CONFIG[status as RefundStatus]?.label ?? status.replace(/_/g, ' ');
};
