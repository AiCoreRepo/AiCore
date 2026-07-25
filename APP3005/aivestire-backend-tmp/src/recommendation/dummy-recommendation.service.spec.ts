import { Occasion } from './enums/recommendation.enum';
import {
  DummyRecommendationService,
  normalizeRecommendationAudience,
  productMatchesRecommendationAudience,
} from './dummy-recommendation.service';

const product = (id: string, audience: 'mens' | 'womens' | undefined) => ({
  product_id: id,
  slug: id,
  title: `${id} Gen Z look`,
  description: 'A comfortable Gen Z outfit for everyday styling.',
  price_cents: 250000,
  inventory_count: 10,
  occasions: ['Casual luxury'],
  body_shapes: ['RECTANGLE'],
  skin_tones: ['MEDIUM'],
  sizes: ['M'],
  metadata: {
    ...(audience ? { audience } : {}),
    style: ['Gen Z', 'Casual'],
    age_group: '18-25',
  },
  images: [{ url: `https://example.com/${id}.jpg`, is_primary: true }],
  creator: { store_name: 'Test Collection' },
});

describe('recommendation audience classification', () => {
  it('normalizes common Aura gender labels', () => {
    expect(normalizeRecommendationAudience('Male')).toBe('mens');
    expect(normalizeRecommendationAudience('woman')).toBe('womens');
    expect(normalizeRecommendationAudience('unknown')).toBeNull();
  });

  it('treats legacy unclassified products as womenswear, never menswear', () => {
    expect(productMatchesRecommendationAudience({}, 'female')).toBe(true);
    expect(productMatchesRecommendationAudience({}, 'male')).toBe(false);
    expect(
      productMatchesRecommendationAudience({ audience: 'mens' }, 'female'),
    ).toBe(false);
  });
});

describe('DummyRecommendationService', () => {
  const products = [
    product('mens-look', 'mens'),
    product('womens-look', 'womens'),
    product('legacy-womens-look', undefined),
  ];
  const prisma = {
    product: { findMany: jest.fn().mockResolvedValue(products) },
  };
  const service = new DummyRecommendationService(prisma as any);

  beforeEach(() => jest.clearAllMocks());

  it('uses dedicated occasion fields and keeps male recommendations male', async () => {
    const result = await service.getDummyRecommendations(
      Occasion.CASUAL_LUXURY,
      {
        gender: 'male',
        ageRange: '18-25',
        skinTone: 'Medium',
        bodyShape: 'Rectangle',
        size: 'M',
      },
    );

    const ids = [
      ...result.perfect_for_you,
      ...result.good_for_you,
      ...result.you_can_also_try,
    ].map((item) => item.product_id);
    expect(ids).toEqual(['mens-look']);
  });

  it('includes classified and legacy womenswear without leaking menswear', async () => {
    const result = await service.getDummyRecommendations(
      Occasion.CASUAL_LUXURY,
      { gender: 'female', ageRange: '18-25' },
    );
    const ids = [
      ...result.perfect_for_you,
      ...result.good_for_you,
      ...result.you_can_also_try,
    ].map((item) => item.product_id);
    expect(ids).toEqual(
      expect.arrayContaining(['womens-look', 'legacy-womens-look']),
    );
    expect(ids).not.toContain('mens-look');
  });
});
