import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import type bull from 'bull';
import { AIProvider } from '../ai-tryon/enums/ai-provider.enum';
import { DirectGeminiTryOnService } from '../ai-tryon/services/providers/direct-gemini-tryon.service';
import { DirectVertexTryOnService } from '../ai-tryon/services/providers/direct-vertex-tryon.service';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { TryOnJobData } from '../queues/tryon-queue.service';
import { JOB_NAMES, QUEUE_NAMES } from '../common/constants/queue.constants';
import type { TryOnResponseDto } from '../ai-tryon/dto/tryon-response.dto';

/**
 * TryOnProcessor — Bull queue consumer for virtual try-on jobs.
 *
 * Lives in src/worker/ and is only registered by WorkerModule.
 * The API process adds jobs; this worker process picks them up via Redis.
 *
 * Handles one job type:
 *  - PROCESS_DIRECT_TRY_ON  → calls Gemini or Vertex AI directly
 */
@Injectable()
@Processor(QUEUE_NAMES.TRY_ON_PROCESSING)
export class TryOnProcessor {
  private readonly logger = new Logger(TryOnProcessor.name);
  private readonly timingLogsEnabled =
    String(process.env.AI_TIMING_LOGS || '').toLowerCase() === 'true';

  constructor(
    private readonly directGeminiService: DirectGeminiTryOnService,
    private readonly directVertexService: DirectVertexTryOnService,
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Process({
    // [OPTIMIZATION Task 4] Increased concurrency from 1 (default) to 6 for direct try-on.
    // Allows up to 6 simultaneous Gemini/Vertex calls per worker process, reducing queue wait.
    name: JOB_NAMES.PROCESS_DIRECT_TRY_ON,
    concurrency: 6,
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

    const service =
      data.provider === AIProvider.GEMINI_AI
        ? this.directGeminiService
        : this.directVertexService;

    try {
      const result = (await service.processTryOn(
        data.avatarImage,
        data.clothingImage,
        data.additionalParams,
      )) as TryOnResponseDto;

      // Persist for gallery/history (best-effort). We keep returning the original
      // base64/data-uri resultImage so the UI can render immediately.
      if (data.productId && data.auraId) {
        const tryOnId = await this.persistTryOnResult({
          userId: data.requestUserId,
          productId: data.productId,
          auraId: data.auraId,
          provider: data.provider,
          resultImage: result.resultImage,
          processingTimeMs: result.processingTimeMs,
        });

        if (tryOnId) {
          result.tryOnId = tryOnId;
        }
      }

      await job.progress(100);
      this.logTiming(
        `jobId=${job.id} type=direct provider=${data.provider} total=${this.formatDuration(Date.now() - totalStartTime)} status=success`,
      );
      return result;
    } catch (error) {
      this.logTiming(
        `jobId=${job.id} type=direct provider=${data.provider} total=${this.formatDuration(Date.now() - totalStartTime)} status=failed error=${error instanceof Error ? error.message : 'unknown error'}`,
      );
      throw error;
    }
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

  private logTiming(message: string): void {
    if (!this.timingLogsEnabled) return;
    this.logger.log(`[TryOnTiming] ${message}`);
  }

  private formatDuration(durationMs: number): string {
    return `${durationMs}ms/${(durationMs / 1000).toFixed(2)}s`;
  }
}
