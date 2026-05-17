import type { ApiError } from '@/lib/api';

export const DEFAULT_TRY_ON_LIMIT = 3;
export const TRY_ON_LIMIT_REACHED_CODE = 'TRY_ON_LIMIT_REACHED';
export const TRY_ON_PURCHASE_CONTACT_EMAIL = 'support@aivestire.com';
export const TRY_ON_PURCHASE_RESULT_PARAM = 'tryOnPurchase';
export const TRY_ON_PURCHASE_TRY_ONS_PARAM = 'tryOnPurchaseTryOns';
export const TRY_ON_PURCHASE_PLAN_PARAM = 'tryOnPurchasePlan';
export const TRY_ON_PURCHASE_REASON_PARAM = 'tryOnPurchaseReason';

export interface TryOnPurchasePlan {
  id: 'starter' | 'style' | 'studio';
  name: string;
  tryOns: number;
  priceInr: number;
  description: string;
  badge?: string;
}

export const TRY_ON_PURCHASE_PLANS: TryOnPurchasePlan[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    tryOns: 3,
    priceInr: 49,
    description: 'Quick top-up for a couple of fresh looks.',
  },
  {
    id: 'style',
    name: 'Style Pack',
    tryOns: 7,
    priceInr: 99,
    description: 'Balanced pack for comparing a few outfit options.',
    badge: 'Most Popular',
  },
  {
    id: 'studio',
    name: 'Studio Pack',
    tryOns: 12,
    priceInr: 149,
    description: 'Best value for longer try-on sessions.',
    badge: 'Best Value',
  },
];

interface TryOnUserUsage {
  try_ons_used?: number;
  max_try_ons?: number;
}

interface TryOnErrorUsage {
  tryOnsUsed?: number;
  maxTryOns?: number;
}

export interface TryOnUsageSnapshot {
  tryOnsUsed: number;
  maxTryOns: number;
  remainingTryOns: number;
}

export interface TryOnPurchaseRedirectState {
  status: 'success' | 'failure' | null;
  tryOns: number | null;
  planId: TryOnPurchasePlan['id'] | null;
  reason: string | null;
}

export function buildTryOnPackPurchaseUrl(plan: TryOnPurchasePlan): string {
  const subject = encodeURIComponent(
    `Buy Virtual Try-On Pack - ${plan.name}`,
  );
  const body = encodeURIComponent(
    [
      'Hi AiVestire team,',
      '',
      `I want to buy the ${plan.name}.`,
      `Pack details: ${plan.tryOns} virtual try-ons for INR ${plan.priceInr}.`,
      '',
      'Please share the payment steps to activate it on my account.',
    ].join('\n'),
  );

  return `mailto:${TRY_ON_PURCHASE_CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

export function parseTryOnPurchaseRedirect(
  search: string,
): TryOnPurchaseRedirectState {
  const params = new URLSearchParams(search);
  const rawStatus = params.get(TRY_ON_PURCHASE_RESULT_PARAM);
  const status =
    rawStatus === 'success' || rawStatus === 'failure' ? rawStatus : null;
  const rawTryOns = params.get(TRY_ON_PURCHASE_TRY_ONS_PARAM);
  const tryOns = rawTryOns ? Number(rawTryOns) : null;
  const rawPlanId = params.get(TRY_ON_PURCHASE_PLAN_PARAM);
  const planId = TRY_ON_PURCHASE_PLANS.some((plan) => plan.id === rawPlanId)
    ? (rawPlanId as TryOnPurchasePlan['id'])
    : null;

  return {
    status,
    tryOns: Number.isFinite(tryOns) ? tryOns : null,
    planId,
    reason: params.get(TRY_ON_PURCHASE_REASON_PARAM),
  };
}

export function stripTryOnPurchaseRedirectParams(search: string): string {
  const params = new URLSearchParams(search);
  params.delete(TRY_ON_PURCHASE_RESULT_PARAM);
  params.delete(TRY_ON_PURCHASE_TRY_ONS_PARAM);
  params.delete(TRY_ON_PURCHASE_PLAN_PARAM);
  params.delete(TRY_ON_PURCHASE_REASON_PARAM);
  return params.toString();
}

export function buildTryOnPurchaseReturnPath(
  pathname: string,
  search: string,
): string {
  const cleanedSearch = stripTryOnPurchaseRedirectParams(search);
  return cleanedSearch ? `${pathname}?${cleanedSearch}` : pathname;
}

export function getEffectiveTryOnLimit(maxTryOns?: number): number {
  const storedLimit = typeof maxTryOns === 'number' && maxTryOns > 0
    ? maxTryOns
    : DEFAULT_TRY_ON_LIMIT;

  return Math.max(storedLimit, DEFAULT_TRY_ON_LIMIT);
}

export function getTryOnUsageSnapshot(
  user?: TryOnUserUsage | null,
): TryOnUsageSnapshot {
  const maxTryOns = getEffectiveTryOnLimit(user?.max_try_ons);
  const tryOnsUsed =
    typeof user?.try_ons_used === 'number' && user.try_ons_used > 0
      ? user.try_ons_used
      : 0;

  return {
    tryOnsUsed,
    maxTryOns,
    remainingTryOns: Math.max(maxTryOns - tryOnsUsed, 0),
  };
}

export function getTryOnLimitSnapshot(
  error?: TryOnErrorUsage | null,
  user?: TryOnUserUsage | null,
): TryOnUsageSnapshot {
  const fallback = getTryOnUsageSnapshot(user);
  const maxTryOns = getEffectiveTryOnLimit(error?.maxTryOns ?? user?.max_try_ons);
  const tryOnsUsed =
    typeof error?.tryOnsUsed === 'number'
      ? error.tryOnsUsed
      : fallback.tryOnsUsed;

  return {
    tryOnsUsed,
    maxTryOns,
    remainingTryOns: Math.max(maxTryOns - tryOnsUsed, 0),
  };
}

export function isTryOnLimitError(error: unknown): error is ApiError {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const apiError = error as ApiError;
  if (apiError.code === TRY_ON_LIMIT_REACHED_CODE) {
    return true;
  }

  return /virtual try-on limit reached|used all .*virtual try-ons/i.test(
    apiError.message || '',
  );
}
