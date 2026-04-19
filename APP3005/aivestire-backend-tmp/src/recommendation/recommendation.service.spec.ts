import { shouldFallbackToDummyRecommendations } from './recommendation.service';

describe('shouldFallbackToDummyRecommendations', () => {
  it('falls back for recommendation DNS failures common in production', () => {
    expect(
      shouldFallbackToDummyRecommendations({ code: 'ENOTFOUND' }),
    ).toBe(true);
    expect(
      shouldFallbackToDummyRecommendations({ code: 'EAI_AGAIN' }),
    ).toBe(true);
  });

  it('falls back for upstream HTTP failures and schema rejections', () => {
    expect(
      shouldFallbackToDummyRecommendations({ response: { status: 502 } }),
    ).toBe(true);
    expect(
      shouldFallbackToDummyRecommendations({ response: { status: 422 } }),
    ).toBe(true);
    expect(
      shouldFallbackToDummyRecommendations({ response: { status: 404 } }),
    ).toBe(true);
  });

  it('does not hide unrelated client-side failures', () => {
    expect(
      shouldFallbackToDummyRecommendations({ response: { status: 401 } }),
    ).toBe(false);
    expect(
      shouldFallbackToDummyRecommendations({ response: { status: 400 } }),
    ).toBe(false);
  });
});
