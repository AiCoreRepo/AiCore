import type { ApiError } from '@/lib/api';
import { isUatOrLocalTryOnHost } from '@/lib/try-on-environment';

export const DEFAULT_TRY_ON_LIMIT = 3;
export const UAT_TRY_ON_LIMIT = 200;
export const TRY_ON_LIMIT_REACHED_CODE = 'TRY_ON_LIMIT_REACHED';
export const TRY_ON_PURCHASE_CONTACT_EMAIL = 'support@aivestire.com';

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
    tryOns: 5,
    priceInr: 49,
    description: 'Quick top-up for a few fresh looks.',
  },
  {
    id: 'style',
    name: 'Style Pack',
    tryOns: 12,
    priceInr: 99,
    description: 'Best pick for shortlisting multiple outfits.',
    badge: 'Most Popular',
  },
  {
    id: 'studio',
    name: 'Studio Pack',
    tryOns: 30,
    priceInr: 199,
    description: 'Built for serious try-ons across full collections.',
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

export function getEffectiveTryOnLimit(maxTryOns?: number): number {
  const storedLimit = typeof maxTryOns === 'number' && maxTryOns > 0
    ? maxTryOns
    : DEFAULT_TRY_ON_LIMIT;

  if (isUatOrLocalTryOnHost()) {
    return Math.max(storedLimit, UAT_TRY_ON_LIMIT);
  }

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
