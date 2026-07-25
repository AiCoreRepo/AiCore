import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuraStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../common/cloudinary.service';
import { TryOnQueueService } from '../../queues/tryon-queue.service';
import {
  buildAuraAttributesMetadata,
  createAuraAvatarHistoryEntry,
  getAuraAttributeSnapshotFromRecord,
  normalizeAuraAvatarHistory,
} from '../../aura/utils/aura-avatar-history.util';
import { AIProvider } from '../enums/ai-provider.enum';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === 'string' && item.trim().length > 0,
      )
    : [];

@Injectable()
export class GuestTryOnClaimService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly tryOnQueue: TryOnQueueService,
  ) {}

  private assertGuestAvatarUrl(value: unknown): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(
        'The completed guest try-on does not contain an Aura avatar.',
      );
    }

    try {
      const url = new URL(value);
      if (
        url.protocol !== 'https:' ||
        url.hostname !== 'res.cloudinary.com' ||
        !url.pathname.includes('/avatars/guest/')
      ) {
        throw new Error('Unexpected guest avatar URL');
      }
      return url.toString();
    } catch {
      throw new BadRequestException('The guest Aura avatar URL is invalid.');
    }
  }

  async claim(
    userId: string,
    guestRequestUserId: string,
    jobId: string,
  ) {
    const completedJob =
      await this.tryOnQueue.getCompletedJobForRequestUser(
        jobId,
        guestRequestUserId,
      );
    if (!completedJob) {
      throw new NotFoundException(
        'The completed guest try-on could not be verified.',
      );
    }

    const { data, result } = completedJob;
    const guestAvatarUrl = this.assertGuestAvatarUrl(
      result.metadata?.guestAvatarUrl,
    );
    const gender =
      data.additionalParams?.garmentGender === 'male' ? 'male' : 'female';
    const existingAura = await this.prisma.aura.findUnique({
      where: { user_id: userId },
    });
    const existingMetadata =
      existingAura?.attributes &&
      typeof existingAura.attributes === 'object' &&
      !Array.isArray(existingAura.attributes)
        ? (existingAura.attributes as Record<string, unknown>)
        : {};
    const claimedJobIds = asStringArray(
      existingMetadata.claimed_guest_tryon_jobs,
    );

    if (claimedJobIds.includes(jobId) && existingAura) {
      const existingTryOn = await this.prisma.tryOn.findFirst({
        where: {
          user_id: userId,
          processing_metrics: {
            path: ['guestJobId'],
            equals: jobId,
          },
        },
        orderBy: { created_at: 'desc' },
      });
      return {
        success: true,
        alreadyClaimed: true,
        auraId: existingAura.aura_id,
        avatarUrl:
          existingAura.tryon_model_url ||
          existingAura.model_url ||
          guestAvatarUrl,
        tryOnId: existingTryOn?.try_on_id,
        resultImageUrl: existingTryOn?.result_image_url || result.resultImage,
      };
    }

    const currentAttributes = existingAura
      ? getAuraAttributeSnapshotFromRecord(existingAura)
      : {};
    const avatarAttributes = { ...currentAttributes, gender };
    const normalizedHistory = normalizeAuraAvatarHistory({
      attributesJson: existingAura?.attributes,
      modelUrl: existingAura?.model_url,
      tryOnModelUrl: existingAura?.tryon_model_url,
      generatedAvatarUrls: existingAura?.generated_avatar_urls,
      createdAt: existingAura?.created_at,
      updatedAt: existingAura?.updated_at,
      currentAttributes,
    });
    const alreadyInHistory = normalizedHistory.avatarHistory.find(
      (entry) =>
        entry.model_url === guestAvatarUrl ||
        entry.tryon_model_url === guestAvatarUrl,
    );
    const claimedAvatar =
      alreadyInHistory ||
      createAuraAvatarHistoryEntry({
        modelUrl: guestAvatarUrl,
        tryOnModelUrl: guestAvatarUrl,
        source: existingAura ? 'recreation' : 'creation',
        generationType: 'generated',
        attributes: avatarAttributes,
      });
    const avatarHistory = alreadyInHistory
      ? normalizedHistory.avatarHistory
      : [...normalizedHistory.avatarHistory, claimedAvatar];
    const attributes = {
      ...buildAuraAttributesMetadata(
        existingAura?.attributes,
        avatarHistory,
        claimedAvatar,
      ),
      claimed_guest_tryon_jobs: [...claimedJobIds, jobId],
      claimed_from_guest: true,
    };
    const generatedAvatarUrls = Array.from(
      new Set([
        ...(existingAura?.generated_avatar_urls || []),
        guestAvatarUrl,
      ]),
    );

    const aura = existingAura
      ? await this.prisma.aura.update({
          where: { aura_id: existingAura.aura_id },
          data: {
            model_url: guestAvatarUrl,
            tryon_model_url: guestAvatarUrl,
            generated_avatar_urls: generatedAvatarUrls,
            attributes: attributes as any,
            gender,
            status: AuraStatus.READY,
          },
        })
      : await this.prisma.aura.create({
          data: {
            user_id: userId,
            image_url: guestAvatarUrl,
            model_url: guestAvatarUrl,
            tryon_model_url: guestAvatarUrl,
            generated_avatar_urls: generatedAvatarUrls,
            attributes: attributes as any,
            gender,
            status: AuraStatus.READY,
          },
        });

    const selectedLookId =
      typeof data.additionalParams?.selectedLookId === 'string'
        ? data.additionalParams.selectedLookId
        : '';
    const product = UUID_PATTERN.test(selectedLookId)
      ? await this.prisma.product.findUnique({
          where: { product_id: selectedLookId },
          select: { product_id: true, title: true },
        })
      : null;

    let tryOnId: string | undefined;
    let resultImageUrl = result.resultImage;
    if (product) {
      const upload = await this.cloudinary.uploadWithMetadata(
        result.resultImage,
        {
          userId,
          productId: product.product_id,
          auraId: aura.aura_id,
          imageType: 'try-on',
          provider: result.provider,
          guestJobId: jobId,
          claimedFromGuest: true,
        },
        'try-ons',
      );
      resultImageUrl = upload.secureUrl;
      const provider =
        result.provider === AIProvider.GEMINI_AI
          ? 'gemini'
          : result.provider === AIProvider.VERTEX_AI
            ? 'vertex'
            : 'unknown';
      const savedTryOn = await this.prisma.tryOn.create({
        data: {
          user_id: userId,
          product_id: product.product_id,
          aura_id: aura.aura_id,
          result_image_url: upload.secureUrl,
          provider,
          cloudinary_public_id: upload.publicId,
          thumbnail_url: this.cloudinary.getThumbnailUrl(upload.publicId, 512),
          compressed_url: this.cloudinary.getCompressedUrl(upload.publicId, 75),
          processing_metrics: {
            guestJobId: jobId,
            claimedFromGuest: true,
            processingTimeMs: result.processingTimeMs,
            provider: result.provider,
          },
        },
        select: { try_on_id: true },
      });
      tryOnId = savedTryOn.try_on_id;
    }

    return {
      success: true,
      alreadyClaimed: false,
      auraId: aura.aura_id,
      avatarUrl: guestAvatarUrl,
      tryOnId,
      productId: product?.product_id,
      productTitle: product?.title,
      resultImageUrl,
    };
  }
}
