export interface AuraImageSource {
  image_url?: string | null;
  model_url?: string | null;
  tryon_model_url?: string | null;
}

export interface ProfileImageUser {
  avatar?: string | null;
  store_name?: string | null;
  name?: string | null;
  email?: string | null;
}

const INVALID_PROFILE_IMAGE_URLS = new Set(["background-uploading"]);

export const PROFILE_IMAGE_OBJECT_POSITION = "center 18%";

export function isUsableProfileImageUrl(
  imageUrl?: string | null,
): imageUrl is string {
  if (!imageUrl) {
    return false;
  }

  const trimmed = imageUrl.trim();
  return (
    trimmed.length > 0 &&
    !INVALID_PROFILE_IMAGE_URLS.has(trimmed.toLowerCase())
  );
}

export function getPreferredAuraImageUrl(
  aura?: AuraImageSource | null,
): string | null {
  if (isUsableProfileImageUrl(aura?.image_url)) {
    return aura.image_url.trim();
  }

  if (isUsableProfileImageUrl(aura?.tryon_model_url)) {
    return aura.tryon_model_url.trim();
  }

  if (isUsableProfileImageUrl(aura?.model_url)) {
    return aura.model_url.trim();
  }

  return null;
}

export function getUserProfileImageUrl(
  user?: ProfileImageUser | null,
  aura?: AuraImageSource | null,
): string | null {
  const avatar =
    isUsableProfileImageUrl(user?.avatar)
      ? user.avatar.trim()
      : null;

  return avatar || getPreferredAuraImageUrl(aura);
}

export function getUserDisplayName(user?: ProfileImageUser | null): string {
  const explicitName = user?.store_name || user?.name;
  if (explicitName && explicitName.trim().length > 0) {
    return explicitName.trim();
  }

  const email = user?.email?.trim();
  if (email) {
    return email.split("@")[0];
  }

  return "User";
}

export function getUserInitials(user?: ProfileImageUser | null): string {
  const displayName = getUserDisplayName(user);
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  return initials || "U";
}
