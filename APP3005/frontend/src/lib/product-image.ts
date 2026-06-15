export interface ProductImageCandidate {
  url?: string | null;
  is_primary?: boolean;
  order_index?: number | null;
}

export interface ProductImageSource {
  images?: ProductImageCandidate[] | null;
  thumbnail?: string | null;
  image?: string | null;
  image_url?: string | null;
  primary_image?: string | null;
}

interface ProductImageOptions {
  requireRemote?: boolean;
}

const INVALID_IMAGE_VALUES = new Set([
  "null",
  "undefined",
  "background-uploading",
]);

const PLACEHOLDER_MARKERS = [
  "via.placeholder.com",
  "text=no+image",
  "text=image+not+found",
  "placeholder.com",
];

const NON_IMAGE_EXTENSIONS = /\.(mp4|mov|webm|avi|mkv)(?:[?#].*)?$/i;

export function isUsableProductImageUrl(
  imageUrl?: string | null,
  options: ProductImageOptions = {},
): imageUrl is string {
  if (!imageUrl) {
    return false;
  }

  const trimmed = imageUrl.trim();
  const lowered = trimmed.toLowerCase();

  if (
    trimmed.length === 0 ||
    INVALID_IMAGE_VALUES.has(lowered) ||
    PLACEHOLDER_MARKERS.some((marker) => lowered.includes(marker)) ||
    lowered.includes("/video/upload/") ||
    NON_IMAGE_EXTENSIONS.test(trimmed)
  ) {
    return false;
  }

  if (!options.requireRemote) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function getProductImageUrls(
  product?: ProductImageSource | null,
  options: ProductImageOptions = {},
): string[] {
  if (!product) {
    return [];
  }

  const sortedImages = [...(product.images ?? [])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) {
      return a.is_primary ? -1 : 1;
    }

    return (a.order_index ?? 0) - (b.order_index ?? 0);
  });

  const candidates = [
    ...sortedImages.map((image) => image.url),
    product.thumbnail,
    product.primary_image,
    product.image_url,
    product.image,
  ];

  const seen = new Set<string>();

  return candidates.reduce<string[]>((urls, candidate) => {
    if (!isUsableProductImageUrl(candidate, options)) {
      return urls;
    }

    const trimmed = candidate.trim();
    if (seen.has(trimmed)) {
      return urls;
    }

    seen.add(trimmed);
    urls.push(trimmed);
    return urls;
  }, []);
}

export function getProductImageUrl(
  product?: ProductImageSource | null,
  options: ProductImageOptions = {},
): string | null {
  return getProductImageUrls(product, options)[0] ?? null;
}
