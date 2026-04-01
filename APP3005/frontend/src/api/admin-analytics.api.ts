import {
  AnalyticsOverview,
  CreatorFinancialSummary,
  CreatorDetailsResponse,
  CreatePayoutPayload,
} from '../types/admin-analytics.types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverview> {
  const res = await fetch(`${API_BASE}/admin/analytics/overview`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch analytics overview');
  return res.json();
}

export async function fetchCreatorsAnalytics(): Promise<CreatorFinancialSummary[]> {
  const res = await fetch(`${API_BASE}/admin/analytics/creators`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch creators analytics');
  return res.json();
}

export async function fetchCreatorAnalyticsDetails(
  creatorId: string
): Promise<CreatorDetailsResponse> {
  const res = await fetch(`${API_BASE}/admin/analytics/creator/${creatorId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch creator analytics details');
  return res.json();
}

export async function createAdminPayout(
  payload: CreatePayoutPayload
): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/payouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create payout');
  }
  return res.json();
}
