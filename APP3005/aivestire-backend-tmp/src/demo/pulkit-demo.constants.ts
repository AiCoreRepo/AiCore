export const PULKIT_DEMO_EMAIL = 'pulkitgupta6677@gmail.com';
export const PULKIT_DEMO_EMAILS = [
  PULKIT_DEMO_EMAIL,
  'rushabhbelani2212@gmail.com',
] as const;

export const PULKIT_DEMO_AVATAR_URL =
  'https://res.cloudinary.com/dxfxicebq/image/upload/f_auto,q_auto:best,w_923,e_sharpen:70/v1785062918/aivestire/demo/pulkit/pulkit-avatar';

export const PULKIT_DEMO_PRODUCT_SLUGS = [
  'male-collection-look-2',
  'male-collection-look-3',
  'male-collection-look-1',
  'ice-blue-embroidered-bandhgala',
  'midnight-floral-bandhgala',
] as const;

const PULKIT_DEMO_TRYON_VERSIONS = [
  '1785064774',
  '1785064779',
  '1785064785',
  '1785064795',
  '1785064808',
] as const;

const PULKIT_DEMO_TRYON_URLS: Record<string, string> = Object.fromEntries(
  PULKIT_DEMO_PRODUCT_SLUGS.map((slug, index) => [
    slug,
    `https://res.cloudinary.com/dxfxicebq/image/upload/f_auto,q_100,w_1024,e_sharpen:100/v${PULKIT_DEMO_TRYON_VERSIONS[index]}/aivestire/demo/pulkit/tryon-${index + 1}-${slug}`,
  ]),
);

const PULKIT_DEMO_ANGLE_VERSIONS = [
  '1785064777',
  '1785064782',
  '1785064789',
  '1785064801',
  '1785064818',
] as const;

const PULKIT_DEMO_ANGLE_URLS: Record<string, string> = Object.fromEntries(
  PULKIT_DEMO_PRODUCT_SLUGS.map((slug, index) => [
    slug,
    `https://res.cloudinary.com/dxfxicebq/image/upload/f_auto,q_100,w_1024,e_sharpen:100/v${PULKIT_DEMO_ANGLE_VERSIONS[index]}/aivestire/demo/pulkit/tryon-${index + 1}-angle-${slug}`,
  ]),
);

export const PULKIT_DEMO_AVATAR_ATTRIBUTES = {
  height_cm: 187,
  weight_kg: 74,
  skin_tone: 'LIGHT',
  gender: 'male',
  body_shape: 'RECTANGLE',
  body_type: 'AVERAGE',
  body_size: 'M',
  age_range: '26-35',
  hair_style: 'SHORT_WAVY',
  beard: true,
} as const;

export const isPulkitDemoEmail = (email?: string | null): boolean =>
  PULKIT_DEMO_EMAILS.includes(
    email?.trim().toLowerCase() as (typeof PULKIT_DEMO_EMAILS)[number],
  );

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

export const getPulkitStaticAngleUrlForSlug = (
  slug?: string | null,
): string | null => (slug ? PULKIT_DEMO_ANGLE_URLS[slug] || null : null);
