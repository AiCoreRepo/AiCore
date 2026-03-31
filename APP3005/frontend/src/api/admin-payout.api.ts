/**
 * Admin Payout API
 * All payout-related API calls in one place.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
export type PayoutType   = 'FULL' | 'PARTIAL';
export type PayoutSource = 'PAYU' | 'MANUAL';

export interface Payout {
  payout_id:          string;
  creator_id:         string;
  amount:             number;
  payout_type:        PayoutType;
  status:             PayoutStatus;
  gateway_status:     string | null;
  transaction_id:     string | null;
  payment_gateway:    PayoutSource | string;
  upi_id:             string | null;
  phone_number:       string | null;
  processed_by_admin: string | null;
  initiated_at:       string;
  completed_at:       string | null;
  failed_at:          string | null;
  failure_reason:     string | null;
  note:               string | null;
  created_at:         string;
}

export interface InitiatePayoutPayload {
  creatorId:   string;
  amount:      number;
  payoutType:  PayoutType;
  upiId:       string;
  phoneNumber: string;
  note?:       string;
}

export interface ManualPayoutEntryPayload {
  creatorId:  string;
  amount:     number;
  status:     PayoutStatus;
  payoutType?: PayoutType;
  remarks?:   string;
}

export interface CreatorPayoutSummary {
  creator_id:       string;
  total_earnings:   number;
  total_paid:       number;
  pending_balance:  number;
  last_payout_date: string | null;
  payouts:          Payout[];
  pagination: {
    page:       number;
    limit:      number;
    total:      number;
    totalPages: number;
    hasMore:    boolean;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = 'Request failed';
    try {
      const data = await res.json();
      message = data?.message ?? message;
    } catch {/* ignore */}
    throw new Error(message);
  }
  return res.json();
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * POST /admin/payouts/initiate
 * Initiates a creator payout via PayU.
 */
export async function initiateCreatorPayout(
  payload: InitiatePayoutPayload,
): Promise<{ payout: Payout; gateway: { txnId: string; status: string } }> {
  const res = await fetch(`${API_BASE}/admin/payouts/initiate`, {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify(payload),
  });
  return handleResponse(res);
}

/**
 * GET /admin/payouts/creator/:creatorId
 * Returns total earnings, total paid, pending balance, and paginated payout history.
 */
export async function fetchCreatorPayoutSummary(
  creatorId: string,
  page  = 1,
  limit = 20,
): Promise<CreatorPayoutSummary> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(
    `${API_BASE}/admin/payouts/creator/${creatorId}?${params}`,
    { credentials: 'include' },
  );
  return handleResponse(res);
}

/**
 * POST /admin/payouts/:payoutId/cancel
 * Cancels a PENDING payout.
 */
export async function cancelCreatorPayout(payoutId: string): Promise<Payout> {
  const res = await fetch(`${API_BASE}/admin/payouts/${payoutId}/cancel`, {
    method:      'POST',
    credentials: 'include',
  });
  return handleResponse(res);
}

/**
 * POST /admin/payouts/manual-entry
 * Creates a manual payout ledger entry with admin-selected status.
 */
export async function createManualPayoutEntry(
  payload: ManualPayoutEntryPayload,
): Promise<Payout> {
  const res = await fetch(`${API_BASE}/admin/payouts/manual-entry`, {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify(payload),
  });
  return handleResponse(res);
}
