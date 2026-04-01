export const TRYON_PROVIDER = {
  VERTEX: 'vertex',
  GEMINI: 'gemini',
} as const;

export type TryOnProvider =
  (typeof TRYON_PROVIDER)[keyof typeof TRYON_PROVIDER];

const PRODUCTION_TRY_ON_HOSTS = new Set(['aivestire.com', 'www.aivestire.com']);
const UAT_OR_LOCAL_TRY_ON_HOSTS = new Set([
  'uat.aivestire.com',
  'dev.aivestire.com',
  'prod.aivestire.com',
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

export function isSupportedTryOnHost(): boolean {
  return isProductionTryOnHost() || isUatOrLocalTryOnHost();
}

export function getTryOnHostErrorMessage(): string {
  const currentOrigin =
    typeof window === 'undefined' ? '' : window.location.origin;

  if (currentOrigin) {
    return `AI Try-On is only available on the official AIVestire domains. Open the site from https://www.aivestire.com instead of ${currentOrigin}.`;
  }

  return 'AI Try-On is only available on the official AIVestire domains. Open the site from https://www.aivestire.com.';
}

export function shouldShowMultipleTryOnProviders(): boolean {
  return !isProductionTryOnHost();
}

export function getDefaultTryOnProvider(): TryOnProvider {
  return isProductionTryOnHost()
    ? TRYON_PROVIDER.GEMINI
    : TRYON_PROVIDER.VERTEX;
}
