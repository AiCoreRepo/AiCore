export interface TryOnHistoryItem {
  tryOnId: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  resultImage: string;
  resultImageUrl: string;
  thumbnailUrl: string | null;
  compressedUrl: string | null;
  provider: string;
  angle: string | null;
  baseTryOnId: string | null;
  anglesGenerated: string[];
  auraId: string;
  selectedAvatarId: string | null;
  selectedAvatarModelUrl: string | null;
  selectedAvatarTryOnModelUrl: string | null;
  createdAt: string;
}

export interface TryOnHistoryResponse {
  success: boolean;
  userId?: string;
  tryOns: TryOnHistoryItem[];
  count: number;
}

export interface AuraAvatarRef {
  avatar_id: string;
  model_url: string;
  tryon_model_url: string;
}

export interface AuraTryOnContext {
  selected_avatar_id?: string | null;
  selected_avatar?: AuraAvatarRef | null;
  model_url?: string | null;
  tryon_model_url?: string | null;
}

const normalizeComparableUrl = (
  value?: string | null,
): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : null;
};

export const normalizeTryOnResultImage = (
  image?: string | null,
): string | null => {
  if (!image) {
    return null;
  }

  const trimmed = image.trim();

  if (!trimmed) {
    return null;
  }

  if (
    trimmed.startsWith("data:") ||
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith("//")
  ) {
    return trimmed;
  }

  return `data:image/jpeg;base64,${trimmed}`;
};

export const isTryOnForCurrentAvatar = (
  tryOn: TryOnHistoryItem,
  aura: AuraTryOnContext | null | undefined,
): boolean => {
  if (!aura) {
    return false;
  }

  const currentAvatarId = aura.selected_avatar_id?.trim() || null;
  const currentTryOnUrl = normalizeComparableUrl(
    aura.selected_avatar?.tryon_model_url || aura.tryon_model_url,
  );
  const currentModelUrl = normalizeComparableUrl(
    aura.selected_avatar?.model_url || aura.model_url,
  );

  if (
    currentAvatarId &&
    tryOn.selectedAvatarId &&
    currentAvatarId === tryOn.selectedAvatarId
  ) {
    return true;
  }

  const storedTryOnUrl = normalizeComparableUrl(
    tryOn.selectedAvatarTryOnModelUrl,
  );
  const storedModelUrl = normalizeComparableUrl(tryOn.selectedAvatarModelUrl);

  const comparisons: Array<[string | null, string | null]> = [
    [currentTryOnUrl, storedTryOnUrl],
    [currentTryOnUrl, storedModelUrl],
    [currentModelUrl, storedTryOnUrl],
    [currentModelUrl, storedModelUrl],
  ];

  return comparisons.some(
    ([left, right]) => Boolean(left) && Boolean(right) && left === right,
  );
};

export const getLatestBaseTryOnForProduct = (
  tryOns: TryOnHistoryItem[],
  productId: string,
): TryOnHistoryItem | null =>
  tryOns.find((tryOn) => tryOn.productId === productId && !tryOn.angle) || null;

export const getLatestBaseTryOnForCurrentAvatar = (
  tryOns: TryOnHistoryItem[],
  productId: string,
  aura: AuraTryOnContext | null | undefined,
): TryOnHistoryItem | null =>
  tryOns.find(
    (tryOn) =>
      tryOn.productId === productId &&
      !tryOn.angle &&
      isTryOnForCurrentAvatar(tryOn, aura),
  ) || null;
