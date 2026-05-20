export const TRYON_PROVIDER = {
  VERTEX: 'vertex',
  GEMINI: 'gemini',
} as const;

export type TryOnProvider =
  (typeof TRYON_PROVIDER)[keyof typeof TRYON_PROVIDER];

const ENV_DEFAULT_TRY_ON_PROVIDER =
  import.meta.env.VITE_TRY_ON_DEFAULT_PROVIDER?.toLowerCase() ===
  TRYON_PROVIDER.GEMINI
    ? TRYON_PROVIDER.GEMINI
    : import.meta.env.VITE_TRY_ON_DEFAULT_PROVIDER?.toLowerCase() ===
        TRYON_PROVIDER.VERTEX
      ? TRYON_PROVIDER.VERTEX
      : null;

const PRODUCTION_TRY_ON_HOSTS = new Set(['aivestire.com', 'www.aivestire.com']);
const DEV_SKIP_TRY_ON_HOSTS = new Set([
  'dev.aivestire.com',
  'uat.aivestire.com',
  'localhost',
  '127.0.0.1',
]);
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

export function canUseTryOnPackDevSkip(): boolean {
  if (isProductionTryOnHost()) {
    return false;
  }

  if (import.meta.env.VITE_ENABLE_TRY_ON_PACK_DEV_SKIP === 'true') {
    return true;
  }

  return import.meta.env.DEV || DEV_SKIP_TRY_ON_HOSTS.has(getCurrentHostname());
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
  if (ENV_DEFAULT_TRY_ON_PROVIDER) {
    return ENV_DEFAULT_TRY_ON_PROVIDER;
  }

  if (isProductionTryOnHost()) {
    return TRYON_PROVIDER.VERTEX;
  }

  return TRYON_PROVIDER.GEMINI;
}
