import type { Request } from 'express';
import {
  DEFAULT_TRY_ON_LIMIT,
  UAT_TRY_ON_LIMIT,
  getEffectiveTryOnLimit,
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

  it('keeps the default limit outside UAT', () => {
    const request = createRequest({
      origin: 'https://aivestire.com',
    });

    expect(getEffectiveTryOnLimit(undefined, request)).toBe(
      DEFAULT_TRY_ON_LIMIT,
    );
  });

  it('raises the effective limit to 50 on UAT', () => {
    const request = createRequest({
      origin: 'https://uat.aivestire.com',
    });

    expect(getEffectiveTryOnLimit(3, request)).toBe(UAT_TRY_ON_LIMIT);
  });

  it('preserves higher stored limits on UAT', () => {
    const request = createRequest({
      origin: 'https://uat.aivestire.com',
    });

    expect(getEffectiveTryOnLimit(75, request)).toBe(75);
  });
});
