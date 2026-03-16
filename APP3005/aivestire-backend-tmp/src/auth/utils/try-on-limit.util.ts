import type { Request } from 'express';

export const DEFAULT_TRY_ON_LIMIT = 3;
export const UAT_TRY_ON_LIMIT = 50;

const UAT_AIVESTIRE_HOST = 'uat.aivestire.com';

function getHeaderValues(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];

  return values
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeHostname(value: string): string | null {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return null;
  }

  try {
    return new URL(normalizedValue).hostname.toLowerCase();
  } catch {
    return normalizedValue
      .replace(/^https?:\/\//i, '')
      .split('/')[0]
      .split(':')[0]
      .toLowerCase();
  }
}

export function isUatAivestireRequest(request?: Request): boolean {
  if (!request) {
    return false;
  }

  const candidates = [
    ...getHeaderValues(request.headers.origin),
    ...getHeaderValues(request.headers.referer),
    ...getHeaderValues(request.headers.host),
    ...getHeaderValues(request.headers['x-forwarded-host']),
  ];

  return candidates.some((candidate) => {
    const hostname = normalizeHostname(candidate);
    return hostname === UAT_AIVESTIRE_HOST;
  });
}

export function getEffectiveTryOnLimit(
  maxTryOns: number | null | undefined,
  request?: Request,
): number {
  const storedLimit =
    typeof maxTryOns === 'number' && maxTryOns > 0
      ? maxTryOns
      : DEFAULT_TRY_ON_LIMIT;

  if (isUatAivestireRequest(request)) {
    return Math.max(storedLimit, UAT_TRY_ON_LIMIT);
  }

  return storedLimit;
}
