import type { Request } from 'express';

export const DEFAULT_TRY_ON_LIMIT = 3;
export const DEFAULT_AVATAR_RECREATION_LIMIT = 2;
export const NON_PROD_TRY_ON_LIMIT = 200;
export const NON_PROD_AVATAR_RECREATION_LIMIT = 200;
export const UAT_TRY_ON_LIMIT = NON_PROD_TRY_ON_LIMIT;

const UAT_AIVESTIRE_HOST = 'uat.aivestire.com';
const LOCAL_AIVESTIRE_HOSTS = new Set(['localhost', '127.0.0.1']);

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

export function isNonProdAivestireRequest(request?: Request): boolean {
  if (!request) {
    return process.env.NODE_ENV !== 'production';
  }

  const candidates = [
    ...getHeaderValues(request.headers.origin),
    ...getHeaderValues(request.headers.referer),
    ...getHeaderValues(request.headers.host),
    ...getHeaderValues(request.headers['x-forwarded-host']),
  ];

  return candidates.some((candidate) => {
    const hostname = normalizeHostname(candidate);
    return (
      hostname === UAT_AIVESTIRE_HOST ||
      (hostname ? LOCAL_AIVESTIRE_HOSTS.has(hostname) : false)
    );
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

  if (isNonProdAivestireRequest(request)) {
    return Math.max(storedLimit, NON_PROD_TRY_ON_LIMIT);
  }

  // Production is capped at 3 try-ons. Older production rows can still carry
  // the deprecated default of 10, so clamp those legacy values here.
  return Math.min(storedLimit, DEFAULT_TRY_ON_LIMIT);
}

export function getEffectiveAvatarRecreationLimit(
  maxAvatarRegenerations: number | null | undefined,
  request?: Request,
): number {
  const storedLimit =
    typeof maxAvatarRegenerations === 'number' && maxAvatarRegenerations > 0
      ? maxAvatarRegenerations
      : DEFAULT_AVATAR_RECREATION_LIMIT;

  if (isNonProdAivestireRequest(request)) {
    return Math.max(storedLimit, NON_PROD_AVATAR_RECREATION_LIMIT);
  }

  return storedLimit;
}
