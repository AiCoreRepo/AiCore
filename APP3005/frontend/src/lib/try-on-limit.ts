import type { ApiError } from '@/lib/api';

export const DEFAULT_TRY_ON_LIMIT = 3;
export const UAT_TRY_ON_LIMIT = 200;
export const TRY_ON_LIMIT_REACHED_CODE = 'TRY_ON_LIMIT_REACHED';
export const TRY_ON_PREMIUM_UPGRADE_URL =
  'mailto:support@aivestire.com?subject=Premium%20Try-On%20Upgrade';

function isUatAivestireHost(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.location.hostname === 'uat.aivestire.com'
    || window.location.hostname === 'localhost'
    || window.location.hostname === '127.0.0.1';
}

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

export function getEffectiveTryOnLimit(maxTryOns?: number): number {
  const storedLimit = typeof maxTryOns === 'number' && maxTryOns > 0
    ? maxTryOns
    : DEFAULT_TRY_ON_LIMIT;

  if (isUatAivestireHost()) {
    return Math.max(storedLimit, UAT_TRY_ON_LIMIT);
  }

  return storedLimit;
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
