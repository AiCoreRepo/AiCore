export const PULKIT_DEMO_EMAIL = 'pulkitgupta6677@gmail.com';

export const PULKIT_DEMO_AVATAR_URL =
  'https://res.cloudinary.com/dxfxicebq/image/upload/f_auto,q_auto:good,w_960/aivestire/demo/pulkit/pulkit-avatar';

export const PULKIT_DEMO_PRODUCT_SLUGS = [
  'male-collection-look-2',
  'male-collection-look-3',
  'male-collection-look-1',
  'ice-blue-embroidered-bandhgala',
  'midnight-floral-bandhgala',
] as const;

const PULKIT_DEMO_TRYON_URLS: Record<string, string> = Object.fromEntries(
  PULKIT_DEMO_PRODUCT_SLUGS.map((slug, index) => [
    slug,
    `https://res.cloudinary.com/dxfxicebq/image/upload/f_auto,q_auto:good,w_1200/aivestire/demo/pulkit/tryon-${index + 1}-${slug}`,
  ]),
);

export const PULKIT_DEMO_AVATAR_ATTRIBUTES = {
  height_cm: 178,
  weight_kg: 74,
  skin_tone: 'MEDIUM',
  gender: 'male',
  body_shape: 'RECTANGLE',
  body_type: 'AVERAGE',
  body_size: 'M',
  age_range: '26-35',
  hair_style: 'SHORT_WAVY',
  beard: true,
} as const;

export const isPulkitDemoEmail = (email?: string | null): boolean =>
  email?.trim().toLowerCase() === PULKIT_DEMO_EMAIL;

export const getPulkitStaticTryOnUrl = (metadata: unknown): string | null => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  const value = (metadata as Record<string, unknown>).pulkit_demo_tryon_url;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

export const getPulkitStaticTryOnUrlForSlug = (
  slug?: string | null,
): string | null => (slug ? PULKIT_DEMO_TRYON_URLS[slug] || null : null);
