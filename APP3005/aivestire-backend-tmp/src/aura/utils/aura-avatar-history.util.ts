import { randomUUID } from 'crypto';

export type AuraAvatarSource = 'creation' | 'recreation';
export type AuraAvatarGenerationType = 'generated' | 'original';

type JsonRecord = Record<string, unknown>;

export interface AuraAvatarAttributeSnapshot {
  height_cm?: number | null;
  weight_kg?: number | null;
  skin_tone?: string | null;
  gender?: string | null;
  body_shape?: string | null;
  body_type?: string | null;
  body_size?: string | null;
  age_range?: string | null;
  hair_style?: string | null;
  beard?: boolean | null;
}

export interface AuraAvatarHistoryEntry {
  avatar_id: string;
  model_url: string;
  tryon_model_url: string;
  source: AuraAvatarSource;
  generation_type: AuraAvatarGenerationType;
  created_at: string;
  attributes: AuraAvatarAttributeSnapshot;
}

interface AuraAvatarMetadata extends JsonRecord {
  avatar_history?: AuraAvatarHistoryEntry[];
  selected_avatar_id?: string | null;
  type?: string;
  generatedAt?: string;
  processedAt?: string;
  attributes?: AuraAvatarAttributeSnapshot;
}

interface NormalizeAuraAvatarHistoryInput {
  attributesJson?: unknown;
  modelUrl?: string | null;
  tryOnModelUrl?: string | null;
  generatedAvatarUrls?: string[] | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  currentAttributes?: AuraAvatarAttributeSnapshot;
}

interface CreateAuraAvatarHistoryEntryInput {
  modelUrl: string;
  tryOnModelUrl?: string | null;
  source: AuraAvatarSource;
  generationType: AuraAvatarGenerationType;
  createdAt?: string | Date | null;
  attributes: AuraAvatarAttributeSnapshot;
}

const isJsonRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const asNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const asBoolean = (value: unknown): boolean | null =>
  typeof value === 'boolean' ? value : null;

const toIsoString = (
  value: string | Date | null | undefined,
  fallback: string,
): string => {
  if (!value) {
    return fallback;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
};

const normalizeAuraAvatarAttributes = (
  value: unknown,
): AuraAvatarAttributeSnapshot => {
  const record = isJsonRecord(value) ? value : {};

  return {
    height_cm: asNumber(record.height_cm),
    weight_kg: asNumber(record.weight_kg),
    skin_tone: asString(record.skin_tone),
    gender: asString(record.gender),
    body_shape: asString(record.body_shape),
    body_type: asString(record.body_type),
    body_size: asString(record.body_size),
    age_range: asString(record.age_range),
    hair_style: asString(record.hair_style),
    beard: asBoolean(record.beard),
  };
};

const normalizeHistoryEntry = (
  value: unknown,
  fallbackCreatedAt: string,
): AuraAvatarHistoryEntry | null => {
  if (!isJsonRecord(value)) {
    return null;
  }

  const modelUrl = asString(value.model_url);
  if (!modelUrl) {
    return null;
  }

  const tryOnModelUrl = asString(value.tryon_model_url) || modelUrl;
  const source = value.source === 'recreation' ? 'recreation' : 'creation';
  const generationType =
    value.generation_type === 'original' ? 'original' : 'generated';

  return {
    avatar_id: asString(value.avatar_id) || randomUUID(),
    model_url: modelUrl,
    tryon_model_url: tryOnModelUrl,
    source,
    generation_type: generationType,
    created_at: toIsoString(asString(value.created_at), fallbackCreatedAt),
    attributes: normalizeAuraAvatarAttributes(value.attributes),
  };
};

export const getAuraAttributeSnapshotFromRecord = (
  aura: Partial<Record<string, unknown>>,
): AuraAvatarAttributeSnapshot => ({
  height_cm: asNumber(aura.height_cm),
  weight_kg: asNumber(aura.weight_kg),
  skin_tone: asString(aura.skin_tone),
  gender: asString(aura.gender),
  body_shape: asString(aura.body_shape),
  body_type: asString(aura.body_type),
  body_size: asString(aura.body_size),
  age_range: asString(aura.age_range),
  hair_style: asString(aura.hair_style),
  beard: asBoolean(aura.beard),
});

export const createAuraAvatarHistoryEntry = ({
  modelUrl,
  tryOnModelUrl,
  source,
  generationType,
  createdAt,
  attributes,
}: CreateAuraAvatarHistoryEntryInput): AuraAvatarHistoryEntry => {
  const createdAtIso = toIsoString(createdAt, new Date().toISOString());

  return {
    avatar_id: randomUUID(),
    model_url: modelUrl,
    tryon_model_url: tryOnModelUrl || modelUrl,
    source,
    generation_type: generationType,
    created_at: createdAtIso,
    attributes: normalizeAuraAvatarAttributes(attributes),
  };
};

export const normalizeAuraAvatarHistory = ({
  attributesJson,
  modelUrl,
  tryOnModelUrl,
  generatedAvatarUrls,
  createdAt,
  updatedAt,
  currentAttributes,
}: NormalizeAuraAvatarHistoryInput) => {
  const metadata = isJsonRecord(attributesJson)
    ? ({ ...attributesJson } as AuraAvatarMetadata)
    : ({} as AuraAvatarMetadata);
  const fallbackCreatedAt = toIsoString(
    updatedAt || createdAt,
    new Date().toISOString(),
  );

  const avatarHistory = Array.isArray(metadata.avatar_history)
    ? metadata.avatar_history
        .map((entry) => normalizeHistoryEntry(entry, fallbackCreatedAt))
        .filter((entry): entry is AuraAvatarHistoryEntry => entry !== null)
    : [];

  const fallbackModelUrl =
    modelUrl ||
    tryOnModelUrl ||
    (generatedAvatarUrls && generatedAvatarUrls.length > 0
      ? generatedAvatarUrls[generatedAvatarUrls.length - 1]
      : null);

  if (avatarHistory.length === 0 && fallbackModelUrl) {
    avatarHistory.push({
      avatar_id: randomUUID(),
      model_url: fallbackModelUrl,
      tryon_model_url: tryOnModelUrl || fallbackModelUrl,
      source: 'creation',
      generation_type: metadata.type === 'original' ? 'original' : 'generated',
      created_at: toIsoString(
        asString(metadata.generatedAt) || asString(metadata.processedAt),
        fallbackCreatedAt,
      ),
      attributes: normalizeAuraAvatarAttributes(
        metadata.attributes || currentAttributes,
      ),
    });
  }

  const requestedSelectedAvatarId = asString(metadata.selected_avatar_id);
  const selectedAvatar =
    avatarHistory.find(
      (entry) => entry.avatar_id === requestedSelectedAvatarId,
    ) ||
    avatarHistory.find(
      (entry) =>
        entry.model_url === modelUrl || entry.tryon_model_url === tryOnModelUrl,
    ) ||
    avatarHistory[avatarHistory.length - 1] ||
    null;

  return {
    metadata,
    avatarHistory,
    selectedAvatar,
    selectedAvatarId: selectedAvatar?.avatar_id || null,
  };
};

export const buildAuraAttributesMetadata = (
  attributesJson: unknown,
  avatarHistory: AuraAvatarHistoryEntry[],
  selectedAvatar: AuraAvatarHistoryEntry | null,
): AuraAvatarMetadata => {
  const existingMetadata = isJsonRecord(attributesJson)
    ? ({ ...attributesJson } as AuraAvatarMetadata)
    : ({} as AuraAvatarMetadata);

  return {
    ...existingMetadata,
    avatar_history: avatarHistory,
    selected_avatar_id: selectedAvatar?.avatar_id || null,
    type: selectedAvatar?.generation_type || existingMetadata.type,
    generatedAt:
      selectedAvatar?.generation_type === 'generated'
        ? selectedAvatar.created_at
        : existingMetadata.generatedAt,
    processedAt:
      selectedAvatar?.generation_type === 'original'
        ? selectedAvatar.created_at
        : existingMetadata.processedAt,
    attributes: selectedAvatar?.attributes || existingMetadata.attributes,
  };
};

export const collectAuraAvatarHistoryImageUrls = (
  avatarHistory: AuraAvatarHistoryEntry[],
): string[] => {
  const urls = new Set<string>();

  for (const entry of avatarHistory) {
    urls.add(entry.model_url);
    urls.add(entry.tryon_model_url);
  }

  return Array.from(urls);
};
