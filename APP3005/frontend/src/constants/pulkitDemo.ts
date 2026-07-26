export const PULKIT_DEMO_EMAIL = "pulkitgupta6677@gmail.com";

export const PULKIT_DEMO_AVATAR_URL =
  "https://res.cloudinary.com/dxfxicebq/image/upload/f_auto,q_auto:good,w_960/aivestire/demo/pulkit/pulkit-avatar";

export const PULKIT_DEMO_FORM_DEFAULTS = {
  height: 178,
  weight: 74,
  skinTone: "medium",
  gender: "male",
  bodyShape: "rectangle",
  bodySize: "medium",
  ageRange: "26-35",
  hairStyle: "short_wavy",
} as const;

export const PULKIT_DEMO_PRODUCT_TITLES = [
  "Midnight Tee Set",
  "Mehendi Green Kurta",
  "Sky Blue Relaxed Shirt",
  "Ice Blue Embroidered Bandhgala",
  "Midnight Floral Bandhgala",
] as const;

export const PULKIT_DEMO_TRYON_URLS = [
  "https://res.cloudinary.com/dxfxicebq/image/upload/f_auto,q_auto:good,w_1200/aivestire/demo/pulkit/tryon-1-male-collection-look-2",
  "https://res.cloudinary.com/dxfxicebq/image/upload/f_auto,q_auto:good,w_1200/aivestire/demo/pulkit/tryon-2-male-collection-look-3",
  "https://res.cloudinary.com/dxfxicebq/image/upload/f_auto,q_auto:good,w_1200/aivestire/demo/pulkit/tryon-3-male-collection-look-1",
  "https://res.cloudinary.com/dxfxicebq/image/upload/f_auto,q_auto:good,w_1200/aivestire/demo/pulkit/tryon-4-ice-blue-embroidered-bandhgala",
  "https://res.cloudinary.com/dxfxicebq/image/upload/f_auto,q_auto:good,w_1200/aivestire/demo/pulkit/tryon-5-midnight-floral-bandhgala",
] as const;

export const getPulkitDemoProductPriority = (title?: string | null) => {
  const index = PULKIT_DEMO_PRODUCT_TITLES.indexOf(
    title as (typeof PULKIT_DEMO_PRODUCT_TITLES)[number],
  );
  return index < 0 ? 0 : index + 1;
};

export const getPulkitDemoTryOnUrl = (title?: string | null): string | null => {
  const priority = getPulkitDemoProductPriority(title);
  return priority ? PULKIT_DEMO_TRYON_URLS[priority - 1] : null;
};

export const isPulkitDemoUser = (email?: string | null) =>
  email?.trim().toLowerCase() === PULKIT_DEMO_EMAIL;
