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

export function getPreferredAuraImageUrl(
  aura?: AuraImageSource | null,
): string | null {
  return aura?.tryon_model_url || aura?.model_url || aura?.image_url || null;
}

export function getUserProfileImageUrl(
  user?: ProfileImageUser | null,
  aura?: AuraImageSource | null,
): string | null {
  const avatar =
    typeof user?.avatar === "string" && user.avatar.trim().length > 0
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
