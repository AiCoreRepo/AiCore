import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  getAuraAttributeSnapshotFromRecord,
  normalizeAuraAvatarHistory,
} from '../../aura/utils/aura-avatar-history.util';

export interface TryOnHistoryItem {
  tryOnId: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  // Frontend gallery expects this key.
  resultImage: string;
  // Backwards/other-client compatibility.
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
  tryOns: TryOnHistoryItem[];
  count: number;
}

interface TryOnAvatarSignature {
  selectedAvatarId: string | null;
  selectedAvatarModelUrl: string | null;
  selectedAvatarTryOnModelUrl: string | null;
}

type TryOnRecordWithProduct = Awaited<
  ReturnType<TryOnHistoryService['fetchTryOnRecords']>
>[number];

const isRecord = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asTrimmedString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const normalizeComparableUrl = (value: string | null): string | null =>
  value ? value.trim().toLowerCase() : null;

@Injectable()
export class TryOnHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  private async fetchTryOnRecords(where: Record<string, unknown>, take?: number) {
    return this.prisma.tryOn.findMany({
      where,
      include: {
        product: {
          select: {
            product_id: true,
            title: true,
            images: {
              where: { is_primary: true },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      ...(typeof take === 'number' ? { take } : {}),
    });
  }

  private extractStoredAvatarSignature(
    tryOn: Pick<TryOnRecordWithProduct, 'processing_metrics' | 'metadata_cache'>,
  ): TryOnAvatarSignature {
    const sources = [tryOn.processing_metrics, tryOn.metadata_cache];

    for (const source of sources) {
      if (!isRecord(source)) {
        continue;
      }

      const selectedAvatarId =
        asTrimmedString(source.selectedAvatarId) ||
        asTrimmedString(source.selected_avatar_id);
      const selectedAvatarModelUrl =
        asTrimmedString(source.selectedAvatarModelUrl) ||
        asTrimmedString(source.selected_avatar_model_url);
      const selectedAvatarTryOnModelUrl =
        asTrimmedString(source.selectedAvatarTryOnModelUrl) ||
        asTrimmedString(source.selected_avatar_tryon_model_url);

      if (
        selectedAvatarId ||
        selectedAvatarModelUrl ||
        selectedAvatarTryOnModelUrl
      ) {
        return {
          selectedAvatarId,
          selectedAvatarModelUrl,
          selectedAvatarTryOnModelUrl,
        };
      }
    }

    return {
      selectedAvatarId: null,
      selectedAvatarModelUrl: null,
      selectedAvatarTryOnModelUrl: null,
    };
  }

  private async getCurrentAuraAvatarSignature(
    auraId: string,
  ): Promise<TryOnAvatarSignature | null> {
    const aura = await this.prisma.aura.findUnique({
      where: { aura_id: auraId },
      select: {
        aura_id: true,
        attributes: true,
        model_url: true,
        tryon_model_url: true,
        generated_avatar_urls: true,
        created_at: true,
        updated_at: true,
        height_cm: true,
        weight_kg: true,
        skin_tone: true,
        gender: true,
        body_shape: true,
        body_type: true,
        body_size: true,
        age_range: true,
        hair_style: true,
        beard: true,
      },
    });

    if (!aura) {
      return null;
    }

    const { selectedAvatar, selectedAvatarId } = normalizeAuraAvatarHistory({
      attributesJson: aura.attributes,
      modelUrl: aura.model_url,
      tryOnModelUrl: aura.tryon_model_url,
      generatedAvatarUrls: aura.generated_avatar_urls,
      createdAt: aura.created_at,
      updatedAt: aura.updated_at,
      currentAttributes: getAuraAttributeSnapshotFromRecord(aura),
    });

    return {
      selectedAvatarId,
      selectedAvatarModelUrl:
        selectedAvatar?.model_url || aura.model_url || null,
      selectedAvatarTryOnModelUrl:
        selectedAvatar?.tryon_model_url ||
        aura.tryon_model_url ||
        selectedAvatar?.model_url ||
        aura.model_url ||
        null,
    };
  }

  private isSameAvatar(
    currentAvatar: TryOnAvatarSignature,
    storedAvatar: TryOnAvatarSignature,
  ): boolean {
    if (
      currentAvatar.selectedAvatarId &&
      storedAvatar.selectedAvatarId &&
      currentAvatar.selectedAvatarId === storedAvatar.selectedAvatarId
    ) {
      return true;
    }

    const currentTryOnUrl = normalizeComparableUrl(
      currentAvatar.selectedAvatarTryOnModelUrl,
    );
    const currentModelUrl = normalizeComparableUrl(
      currentAvatar.selectedAvatarModelUrl,
    );
    const storedTryOnUrl = normalizeComparableUrl(
      storedAvatar.selectedAvatarTryOnModelUrl,
    );
    const storedModelUrl = normalizeComparableUrl(
      storedAvatar.selectedAvatarModelUrl,
    );

    const comparisons: Array<[string | null, string | null]> = [
      [currentTryOnUrl, storedTryOnUrl],
      [currentTryOnUrl, storedModelUrl],
      [currentModelUrl, storedTryOnUrl],
      [currentModelUrl, storedModelUrl],
    ];

    return comparisons.some(
      ([left, right]) => Boolean(left) && Boolean(right) && left === right,
    );
  }

  private mapTryOnRecord(tryOn: TryOnRecordWithProduct): TryOnHistoryItem {
    const avatarSignature = this.extractStoredAvatarSignature(tryOn);

    return {
      tryOnId: tryOn.try_on_id,
      productId: tryOn.product_id,
      productTitle: tryOn.product.title,
      productImage: tryOn.product.images[0]?.url ?? null,
      resultImage: tryOn.result_image_url,
      resultImageUrl: tryOn.result_image_url,
      thumbnailUrl: tryOn.thumbnail_url ?? null,
      compressedUrl: tryOn.compressed_url ?? null,
      provider: tryOn.provider,
      angle: tryOn.angle ?? null,
      baseTryOnId: (tryOn.base_tryon_id as string | null) ?? null,
      anglesGenerated: tryOn.angles_generated ?? [],
      auraId: tryOn.aura_id,
      selectedAvatarId: avatarSignature.selectedAvatarId,
      selectedAvatarModelUrl: avatarSignature.selectedAvatarModelUrl,
      selectedAvatarTryOnModelUrl:
        avatarSignature.selectedAvatarTryOnModelUrl,
      createdAt: tryOn.created_at.toISOString(),
    };
  }

  async getTryOnHistory(
    userId: string,
    take?: number,
  ): Promise<TryOnHistoryResponse> {
    const tryOns = await this.fetchTryOnRecords({ user_id: userId }, take);

    return {
      success: true,
      tryOns: tryOns.map((tryOn) => this.mapTryOnRecord(tryOn)),
      count: tryOns.length,
    };
  }

  async findReusableBaseTryOnForCurrentAvatar(
    userId: string,
    productId: string,
    auraId: string,
  ): Promise<TryOnHistoryItem | null> {
    const currentAvatar =
      await this.getCurrentAuraAvatarSignature(auraId);

    if (!currentAvatar) {
      return null;
    }

    const tryOns = await this.fetchTryOnRecords(
      {
        user_id: userId,
        product_id: productId,
        aura_id: auraId,
        angle: null,
      },
      20,
    );

    for (const tryOn of tryOns) {
      const storedAvatar = this.extractStoredAvatarSignature(tryOn);

      if (
        !storedAvatar.selectedAvatarId &&
        !storedAvatar.selectedAvatarModelUrl &&
        !storedAvatar.selectedAvatarTryOnModelUrl
      ) {
        continue;
      }

      if (this.isSameAvatar(currentAvatar, storedAvatar)) {
        return this.mapTryOnRecord(tryOn);
      }
    }

    return null;
  }
}
