import type { CookieOptions } from 'express';

export const JWT_ACCESS_TOKEN_EXPIRES_IN = '24h';
export const JWT_REFRESH_TOKEN_EXPIRES_IN = '7d';

export const REFRESH_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  // Scope the refresh cookie to the full app so it is sent for both
  // direct backend requests (/auth/refresh) and frontend-proxied ones (/api/auth/refresh).
  path: '/',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
