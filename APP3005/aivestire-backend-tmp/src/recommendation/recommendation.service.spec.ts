import {
  isUsableRecommendationImageUrl,
  resolveRecommendationAuraImageUrl,
  shouldFallbackToDummyRecommendations,
} from './recommendation.service';

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

describe('resolveRecommendationAuraImageUrl', () => {
  it('treats background-uploading as an invalid persisted source image', () => {
    expect(isUsableRecommendationImageUrl('background-uploading')).toBe(false);
  });

  it('falls back to the generated aura image when source image is a placeholder', () => {
    expect(
      resolveRecommendationAuraImageUrl({
        image_url: 'background-uploading',
        model_url: 'https://example.com/avatar-full.jpg',
        tryon_model_url: 'https://example.com/avatar-tryon.jpg',
        generated_avatar_urls: null,
        attributes: null,
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        updated_at: new Date('2026-01-01T00:00:00.000Z'),
      } as any),
    ).toBe('https://example.com/avatar-tryon.jpg');
  });
});
