import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import type bull from 'bull';
import { AIProvider } from '../ai-tryon/enums/ai-provider.enum';
import { DirectGeminiTryOnService } from '../ai-tryon/services/providers/direct-gemini-tryon.service';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { TryOnJobData } from '../queues/tryon-queue.service';
import { JOB_NAMES, QUEUE_NAMES } from '../common/constants/queue.constants';
import type { TryOnResponseDto } from '../ai-tryon/dto/tryon-response.dto';
import { TRYON_WORKER_CONCURRENCY } from '../ai-tryon/constants/tryon.constants';
import {
  getAuraAttributeSnapshotFromRecord,
  normalizeAuraAvatarHistory,
} from '../aura/utils/aura-avatar-history.util';

/**
 * TryOnProcessor — Bull queue consumer for virtual try-on jobs.
 *
 * Lives in src/worker/ and is only registered by WorkerModule.
 * The API process adds jobs; this worker process picks them up via Redis.
 *
 * Handles one job type:
 *  - PROCESS_DIRECT_TRY_ON  → calls Gemini 3.1 Image directly
 */
@Injectable()
@Processor(QUEUE_NAMES.TRY_ON_PROCESSING)
export class TryOnProcessor {
  private readonly logger = new Logger(TryOnProcessor.name);
  private readonly timingLogsEnabled =
    String(process.env.AI_TIMING_LOGS || '').toLowerCase() === 'true';

  constructor(
    private readonly directGeminiService: DirectGeminiTryOnService,
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {
    this.logger.log(
      `✅ [TryOnProcessor] Try-on concurrency configured: ${TRYON_WORKER_CONCURRENCY}`,
    );
  }

  @Process({
    // Keep try-on concurrency conservative in prod so Gemini image generations do not pile up and self-timeout.
    name: JOB_NAMES.PROCESS_DIRECT_TRY_ON,
    concurrency: TRYON_WORKER_CONCURRENCY,
  })
  async handleDirectTryOn(job: bull.Job<TryOnJobData>) {
    const data = job.data;
    const totalStartTime = Date.now();
    await job.progress(10);

    if (data.type !== 'direct') {
      throw new Error('Invalid direct try-on job payload');
    }

    this.logger.log(
      `Starting queued direct try-on for user ${data.requestUserId} with ${data.provider}`,
    );

    try {
      const result = await this.processTryOnWithGemini(data);

      // Persist for gallery/history (best-effort). We keep returning the original
      // base64/data-uri resultImage so the UI can render immediately.
      if (data.productId && data.auraId) {
        const tryOnId = await this.persistTryOnResult({
          userId: data.requestUserId,
          productId: data.productId,
          auraId: data.auraId,
          provider: result.provider,
          resultImage: result.resultImage,
          processingTimeMs: result.processingTimeMs,
        });

        if (tryOnId) {
          result.tryOnId = tryOnId;
        }
      }

      await job.progress(100);
      this.logTiming(
        `jobId=${job.id} type=direct requested_provider=${data.provider} actual_provider=${result.provider} total=${this.formatDuration(Date.now() - totalStartTime)} status=success`,
      );
      return result;
    } catch (error) {
      this.logTiming(
        `jobId=${job.id} type=direct provider=${data.provider} total=${this.formatDuration(Date.now() - totalStartTime)} status=failed error=${error instanceof Error ? error.message : 'unknown error'}`,
      );
      throw error;
    }
  }

  private async processTryOnWithGemini(
    data: TryOnJobData,
  ): Promise<TryOnResponseDto> {
    let avatarImage = data.avatarImage;
    let guestAvatarUrl: string | undefined;

    if (data.guestAvatarFirst) {
      const guestGender =
        data.additionalParams?.garmentGender === 'male' ? 'male' : 'female';
      this.logger.log(
        `Uploading the original ${guestGender} guest photo as the try-on wearer`,
      );
      const avatarUpload = await this.cloudinary.uploadWithMetadata(
        data.avatarImage,
        {
          imageType: 'avatar',
          avatarVariant: 'guest-original',
          guestSession: data.requestUserId,
          gender: guestGender,
          identitySource: 'uploaded-image',
          generationSource: 'original-upload',
        },
        'avatars/guest',
      );
      guestAvatarUrl = avatarUpload.secureUrl;
      avatarImage = guestAvatarUrl;
      this.logger.log(
        'Original guest photo uploaded and selected as the try-on wearer',
      );
    }

    const result = (await this.directGeminiService.processTryOn(
      avatarImage,
      data.clothingImage,
      data.additionalParams,
    )) as TryOnResponseDto;
    result.metadata = {
      ...(result.metadata || {}),
      requestedProvider: data.provider,
      modelPolicy: 'gemini-3.1-only',
      ...(guestAvatarUrl ? { guestAvatarUrl } : {}),
    };
    return result;
  }

  private async persistTryOnResult(input: {
    userId: string;
    productId: string;
    auraId: string;
    provider: AIProvider;
    resultImage: string;
    processingTimeMs: number;
  }): Promise<string | null> {
    try {
      const selectedAvatarSignature = await this.getSelectedAvatarSignature(
        input.auraId,
      );

      // Upload the final image to Cloudinary so gallery uses URLs.
      const upload = await this.cloudinary.uploadWithMetadata(
        input.resultImage,
        {
          userId: input.userId,
          productId: input.productId,
          auraId: input.auraId,
          imageType: 'try-on',
          processingTime: input.processingTimeMs,
          provider: input.provider,
        },
        'try-ons',
      );

      const thumbnailUrl = this.cloudinary.getThumbnailUrl(upload.publicId, 512);
      const compressedUrl = this.cloudinary.getCompressedUrl(upload.publicId, 75);

      const providerLabel =
        input.provider === AIProvider.GEMINI_AI
          ? 'gemini'
          : input.provider === AIProvider.VERTEX_AI
            ? 'vertex'
            : 'unknown';

      const saved = await this.prisma.tryOn.create({
        data: {
          user_id: input.userId,
          product_id: input.productId,
          aura_id: input.auraId,
          result_image_url: upload.secureUrl,
          provider: providerLabel,
          cloudinary_public_id: upload.publicId,
          thumbnail_url: thumbnailUrl,
          compressed_url: compressedUrl,
          processing_metrics: {
            processingTimeMs: input.processingTimeMs,
            provider: input.provider,
            bytes: upload.bytes,
            format: upload.format,
            width: upload.width,
            height: upload.height,
            ...selectedAvatarSignature,
          },
        },
        select: { try_on_id: true },
      });

      await this.prisma.user.update({
        where: { user_id: input.userId },
        data: { try_ons_used: { increment: 1 } },
      });

      return saved.try_on_id;
    } catch (error) {
      this.logger.error(
        `Failed to persist try-on result: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  private async getSelectedAvatarSignature(auraId: string): Promise<{
    selectedAvatarId?: string;
    selectedAvatarModelUrl?: string;
    selectedAvatarTryOnModelUrl?: string;
  }> {
    const aura = await this.prisma.aura.findUnique({
      where: { aura_id: auraId },
      select: {
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
      return {};
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
      ...(selectedAvatarId ? { selectedAvatarId } : {}),
      ...(selectedAvatar?.model_url || aura.model_url
        ? {
            selectedAvatarModelUrl:
              selectedAvatar?.model_url || aura.model_url || undefined,
          }
        : {}),
      ...(selectedAvatar?.tryon_model_url ||
      aura.tryon_model_url ||
      selectedAvatar?.model_url ||
      aura.model_url
        ? {
            selectedAvatarTryOnModelUrl:
              selectedAvatar?.tryon_model_url ||
              aura.tryon_model_url ||
              selectedAvatar?.model_url ||
              aura.model_url ||
              undefined,
          }
        : {}),
    };
  }

  private logTiming(message: string): void {
    if (!this.timingLogsEnabled) return;
    this.logger.log(`[TryOnTiming] ${message}`);
  }

  private formatDuration(durationMs: number): string {
    return `${durationMs}ms/${(durationMs / 1000).toFixed(2)}s`;
  }
}
