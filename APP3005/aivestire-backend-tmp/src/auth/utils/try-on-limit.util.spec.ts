import type { Request } from 'express';
import {
  DEFAULT_AVATAR_RECREATION_LIMIT,
  DEFAULT_TRY_ON_LIMIT,
  NON_PROD_AVATAR_RECREATION_LIMIT,
  UAT_TRY_ON_LIMIT,
  getEffectiveAvatarRecreationLimit,
  getEffectiveTryOnLimit,
  isNonProdAivestireRequest,
  isUatAivestireRequest,
} from './try-on-limit.util';

function createRequest(
  headers: Partial<Request['headers']>,
): Request {
  return {
    headers,
  } as Request;
}

describe('try-on limit utility', () => {
  it('detects the UAT frontend from request origin', () => {
    const request = createRequest({
      origin: 'https://uat.aivestire.com',
    });

    expect(isUatAivestireRequest(request)).toBe(true);
  });

  it('detects the UAT frontend from request referer', () => {
    const request = createRequest({
      referer: 'https://uat.aivestire.com/collection',
    });

    expect(isUatAivestireRequest(request)).toBe(true);
  });

  it('detects localhost requests as non-prod', () => {
    const request = createRequest({
      origin: 'http://localhost:8080',
    });

    expect(isNonProdAivestireRequest(request)).toBe(true);
  });

  it('keeps the default limit outside UAT', () => {
    const request = createRequest({
      origin: 'https://aivestire.com',
    });

    expect(getEffectiveTryOnLimit(undefined, request)).toBe(
      DEFAULT_TRY_ON_LIMIT,
    );
  });

  it('clamps legacy production limits back to the enforced cap', () => {
    const request = createRequest({
      origin: 'https://aivestire.com',
    });

    expect(getEffectiveTryOnLimit(10, request)).toBe(DEFAULT_TRY_ON_LIMIT);
  });

  it('raises the effective try-on limit to 200 on UAT', () => {
    const request = createRequest({
      origin: 'https://uat.aivestire.com',
    });

    expect(getEffectiveTryOnLimit(3, request)).toBe(UAT_TRY_ON_LIMIT);
  });

  it('preserves higher stored limits on UAT', () => {
    const request = createRequest({
      origin: 'https://uat.aivestire.com',
    });

    expect(getEffectiveTryOnLimit(275, request)).toBe(275);
  });

  it('uses the production recreation default outside non-prod', () => {
    const request = createRequest({
      origin: 'https://aivestire.com',
    });

    expect(getEffectiveAvatarRecreationLimit(undefined, request)).toBe(
      DEFAULT_AVATAR_RECREATION_LIMIT,
    );
  });

  it('raises the effective recreation limit to 200 on localhost', () => {
    const request = createRequest({
      origin: 'http://localhost:8080',
    });

    expect(getEffectiveAvatarRecreationLimit(2, request)).toBe(
      NON_PROD_AVATAR_RECREATION_LIMIT,
    );
  });
});
