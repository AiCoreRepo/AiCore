const INVALID_TOKEN_VALUES = new Set(["", "null", "undefined"]);

function decodeBase64UrlSegment(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    return atob(padded);
  } catch {
    return null;
  }
}

export function isProbablyJwt(token: string): boolean {
  const normalizedToken = token.trim();
  if (!normalizedToken || INVALID_TOKEN_VALUES.has(normalizedToken)) {
    return false;
  }

  const parts = normalizedToken.split(".");
  if (parts.length !== 3 || parts.some((part) => !part.trim())) {
    return false;
  }

  const payloadJson = decodeBase64UrlSegment(parts[1]);
  if (!payloadJson) {
    return false;
  }

  try {
    const payload = JSON.parse(payloadJson);
    return typeof payload === "object" && payload !== null;
  } catch {
    return false;
  }
}

export function clearStoredAuthTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function getStoredAccessToken(): string | null {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return null;
  }

  const normalizedToken = token.trim();
  if (!isProbablyJwt(normalizedToken)) {
    clearStoredAuthTokens();
    return null;
  }

  return normalizedToken;
}
