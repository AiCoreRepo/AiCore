export const TRYON_PROVIDER = {
  VERTEX: 'vertex',
  GEMINI: 'gemini',
} as const;

export type TryOnProvider =
  (typeof TRYON_PROVIDER)[keyof typeof TRYON_PROVIDER];

const PRODUCTION_TRY_ON_HOSTS = new Set(['aivestire.com', 'www.aivestire.com']);
const UAT_OR_LOCAL_TRY_ON_HOSTS = new Set([
  'uat.aivestire.com',
  'localhost',
  '127.0.0.1',
]);

function getCurrentHostname(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.hostname.toLowerCase();
}

export function isProductionTryOnHost(): boolean {
  return PRODUCTION_TRY_ON_HOSTS.has(getCurrentHostname());
}

export function isUatOrLocalTryOnHost(): boolean {
  return UAT_OR_LOCAL_TRY_ON_HOSTS.has(getCurrentHostname());
}

export function shouldShowMultipleTryOnProviders(): boolean {
  return !isProductionTryOnHost();
}

export function getDefaultTryOnProvider(): TryOnProvider {
  return isProductionTryOnHost()
    ? TRYON_PROVIDER.GEMINI
    : TRYON_PROVIDER.VERTEX;
}
