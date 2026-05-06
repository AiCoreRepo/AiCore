import { Injectable } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import type bull from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { GeminiAIService } from '../common/gemini-ai.service';
import { ImageOptimizerService } from '../common/image-optimizer.service';
import { AuraJobData } from '../queues/aura-queue.service';
import { AuraStatus } from '@prisma/client';
import { QUEUE_NAMES, JOB_NAMES } from '../common/constants/queue.constants';
import { AURA_WORKER_CONCURRENCY } from '../ai-tryon/constants/tryon.constants';
import {
  buildAuraAttributesMetadata,
  createAuraAvatarHistoryEntry,
  getAuraAttributeSnapshotFromRecord,
  normalizeAuraAvatarHistory,
} from '../aura/utils/aura-avatar-history.util';

const BACKGROUND_UPLOAD_PLACEHOLDER = 'background-uploading';

/**
 * AuraProcessor — Bull queue consumer for Aura avatar generation jobs.
 *
 * Lives in src/worker/ and is only registered by WorkerModule.
 * The API process enqueues jobs; this worker processes them asynchronously.
 *
 * Flow per job:
 *  1. Resize source image (sharp)
 *  2. Fire Cloudinary upload in the background (don't block Gemini)
 *  3. Call Gemini AI for avatar generation (gemini-3.1-flash-image-preview)
 *  4. Normalize avatar to 2:3 portrait canvas
 *  5. Upload final avatar to Cloudinary
 *  6. Update Aura record in DB with avatar URLs and history
 */
@Injectable()
@Processor(QUEUE_NAMES.AURA_GENERATION)
export class AuraProcessor {
  private readonly timingLogsEnabled =
    String(process.env.AI_TIMING_LOGS || '').toLowerCase() === 'true';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly geminiAI: GeminiAIService,
    private readonly imageOptimizer: ImageOptimizerService,
  ) {
    console.log(
      '✅ [AuraProcessor] Processor initialized for queue:',
      QUEUE_NAMES.AURA_GENERATION,
    );
    console.log(
      `✅ [AuraProcessor] Aura concurrency configured: ${AURA_WORKER_CONCURRENCY}`,
    );
  }

  @Process({
    // Keep Aura concurrency conservative in prod so Gemini image requests do not saturate the worker.
    name: JOB_NAMES.GENERATE_AVATARS,
    concurrency: AURA_WORKER_CONCURRENCY,
  })
  async handleAuraGeneration(job: bull.Job<AuraJobData>) {
    const {
      auraId,
      userId,
      imageUrl,
      sourceImageData,
      sourceImageMimeType,
      attributes,
      generationSource,
    } = job.data;

    const totalStartTime = Date.now();

    try {
      let sourceUploadMs = 0;
      let geminiMs = 0;
      let finalUploadMs = 0;
      let dbUpdateMs = 0;

      console.log(
        `\n🚀 [Aura Processor] Starting avatar generation for Aura: ${auraId}`,
      );

      let sourceImageUrl = imageUrl || '';
      let processedSourceData: string | undefined = undefined;

      if (sourceImageData) {
        await job.progress(10);
        console.log(`📤 [Aura Processor] Uploading source image...`);
        const sourceUploadStart = Date.now();

        // [OPTIMIZATION Task 2] Pre-resize source image to max 512x768 before uploading to Cloudinary
        // and before sending to Gemini AI. This reduces payload size and AI inference time for Aura.
        processedSourceData = sourceImageData;
        try {
          const sharp = (await import('sharp')).default;
          const rawBuffer = Buffer.from(
            sourceImageData.replace(/^data:[^;]+;base64,/, ''),
            'base64',
          );
          // [Speed-Opt-4] Reduced from 512×768 → 400×600 (~39% fewer pixels).
          // Avatar generation only needs enough detail to reconstruct the person — not full-res.
          const resizedBuffer = await sharp(rawBuffer)
            .resize(400, 600, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
          processedSourceData = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
          console.log(`[Speed-Opt-4] Aura source resized: ${rawBuffer.length} -> ${resizedBuffer.length} bytes`);
        } catch (resizeErr: any) {
          console.warn(`[Opt:Task2] Aura source resize failed, using original: ${resizeErr.message}`);
        }

        // [OPTIMIZATION Task 3] Don't await the upload. Fire and forget so we can start Gemini immediately using raw base64.
        const sourceUploadPromise = this.cloudinary.uploadWithMetadata(
          processedSourceData,
          {
            userId,
            auraId,
            imageType: 'avatar',
            avatarVariant: 'source',
            source: sourceImageMimeType || 'user-upload',
          },
          'avatars/source',
        ).catch(e => console.warn(`[Opt:Task3] Cloudinary background upload failed: ${e.message}`));

        // Update the DB with the Cloudinary URL once upload resolves (non-blocking)
        sourceUploadPromise.then((res: any) => {
          if (res && res.secureUrl) {
            this.prisma.aura.update({
              where: { aura_id: auraId },
              data: { image_url: res.secureUrl },
            }).catch(e => console.log('Background aura DB URL update failed', e.message));
          }
        });

        sourceUploadMs = Date.now() - sourceUploadStart;
        // Temporary fallback URL; Gemini will use sourceImageData directly
        sourceImageUrl = BACKGROUND_UPLOAD_PLACEHOLDER;
      }

      if (!sourceImageUrl && !sourceImageData) {
        throw new Error('No source image available for avatar generation');
      }

      // Generate avatar image directly using Gemini AI (gemini-3.1-flash-image-preview)
      await job.progress(20);
      console.log(`🎨 [Aura Processor] Generating avatar with Gemini...`);
      const geminiStart = Date.now();

      const imageGeneration = await this.geminiAI.generateAvatarImage({
        // [OPTIMIZATION Task 3] Pass base64 direct to Gemini to bypass Cloudinary HTTP roundtrip
        sourceImageData: sourceImageData ? processedSourceData : undefined,
        imageUrl: sourceImageUrl,
        attributes,
      });
      geminiMs = Date.now() - geminiStart;

      if (!imageGeneration.success || !imageGeneration.imageBase64) {
        throw new Error(
          imageGeneration.error || 'Gemini avatar generation did not return an image',
        );
      }

      let finalAvatarUrl: string;
      let tryOnAvatarUrl: string;
      let avatarMetadata: any;

      // Generated image — normalize and upload
      await job.progress(50);
      console.log(`📤 [Aura Processor] Uploading portrait-normalized generated avatar...`);
      const finalUploadStart = Date.now();
      const normalizedAvatarImage =
        await this.imageOptimizer.normalizeToPortraitCanvas(
          `data:image/png;base64,${imageGeneration.imageBase64}`,
          {
            targetAspectRatio: 2 / 3,
            maxWidth: 1200,
            maxHeight: 1800,
            quality: 92,
            format: 'jpeg',
          },
        );
      const avatarUpload = await this.cloudinary.uploadWithMetadata(
        normalizedAvatarImage,
        {
          userId,
          auraId,
          imageType: 'avatar',
          avatarVariant: 'full',
          source: 'gemini-generated',
          normalizedAspectRatio: '2:3',
        },
        'avatars',
      );
      finalUploadMs = Date.now() - finalUploadStart;
      finalAvatarUrl = avatarUpload.secureUrl;
      console.log(`✅ [Aura Processor] Generated avatar uploaded`);

      avatarMetadata = {
        type: 'generated',
        generatedAt: new Date().toISOString(),
        attributes,
      };

      // Direct try-on uses the full avatar URL
      tryOnAvatarUrl = finalAvatarUrl;

      await job.progress(70);

      // Update database
      console.log(`💾 [Aura Processor] Updating database...`);
      await job.progress(90);
      const dbUpdateStart = Date.now();

      const existingAura = await this.prisma.aura.findUnique({
        where: { aura_id: auraId },
      });
      const currentAuraAttributes = existingAura
        ? getAuraAttributeSnapshotFromRecord(existingAura)
        : {
            height_cm: attributes.height,
            weight_kg: attributes.weight,
            skin_tone: attributes.skinTone,
            gender: attributes.gender,
            body_shape: attributes.bodyShape,
            body_size: attributes.bodySize,
            age_range: attributes.ageRange,
            hair_style: attributes.hairStyle,
          };
      const { avatarHistory } = normalizeAuraAvatarHistory({
        attributesJson: existingAura?.attributes,
        modelUrl: existingAura?.model_url,
        tryOnModelUrl: existingAura?.tryon_model_url,
        generatedAvatarUrls: existingAura?.generated_avatar_urls,
        createdAt: existingAura?.created_at,
        updatedAt: existingAura?.updated_at,
        currentAttributes: currentAuraAttributes,
      });
      const currentAvatar = createAuraAvatarHistoryEntry({
        modelUrl: finalAvatarUrl,
        tryOnModelUrl: tryOnAvatarUrl,
        source:
          generationSource === 'recreation' || avatarHistory.length > 0
            ? 'recreation'
            : 'creation',
        generationType:
          avatarMetadata.type === 'original' ? 'original' : 'generated',
        createdAt: avatarMetadata.generatedAt || avatarMetadata.processedAt,
        attributes: currentAuraAttributes,
      });
      const updatedAvatarHistory = [...avatarHistory, currentAvatar];
      const generatedAvatarUrls = Array.from(
        new Set([
          ...(existingAura?.generated_avatar_urls ?? []),
          finalAvatarUrl,
        ]),
      );
      const persistedSourceImageUrl =
        sourceImageUrl && sourceImageUrl !== BACKGROUND_UPLOAD_PLACEHOLDER
          ? sourceImageUrl
          : existingAura?.image_url &&
              existingAura.image_url !== BACKGROUND_UPLOAD_PLACEHOLDER
            ? existingAura.image_url
            : null;

      const updatedAura = await this.prisma.aura.update({
        where: { aura_id: auraId },
        data: {
          status: AuraStatus.READY,
          image_url: persistedSourceImageUrl,
          model_url: finalAvatarUrl,
          tryon_model_url: tryOnAvatarUrl,
          generated_avatar_urls: generatedAvatarUrls,
          attributes: buildAuraAttributesMetadata(
            existingAura?.attributes,
            updatedAvatarHistory,
            currentAvatar,
          ) as any,
        },
      });
      dbUpdateMs = Date.now() - dbUpdateStart;

      console.log(`✅ [Aura Processor] Avatar ready: ${auraId}`);
      console.log(`   - URL: ${updatedAura.model_url}`);
      console.log(`   - Try-on avatar URL: ${updatedAura.tryon_model_url}`);
      console.log(`   - Status: ${updatedAura.status}\n`);
      this.logTiming(
        `auraId=${auraId} total=${this.formatDuration(Date.now() - totalStartTime)} source_upload=${this.formatDuration(sourceUploadMs)} gemini=${this.formatDuration(geminiMs)} final_upload=${this.formatDuration(finalUploadMs)} db_update=${this.formatDuration(dbUpdateMs)} generation_type=${avatarMetadata.type}`,
      );

      await job.progress(100);

      return {
        success: true,
        auraId,
        avatar: {
          avatarId: currentAvatar.avatar_id,
          url: finalAvatarUrl,
          tryOnUrl: tryOnAvatarUrl,
          type: avatarMetadata.type,
        },
        aura: {
          aura_id: updatedAura.aura_id,
          status: updatedAura.status,
          model_url: updatedAura.model_url,
          tryon_model_url: updatedAura.tryon_model_url,
        },
      };
    } catch (error) {
      console.error(`❌ [Aura Processor] Error for Aura: ${auraId}`, error);
      this.logTiming(
        `auraId=${auraId} total=${this.formatDuration(Date.now() - totalStartTime)} status=failed error=${error instanceof Error ? error.message : 'unknown error'}`,
      );

      await this.prisma.aura.update({
        where: { aura_id: auraId },
        data: { status: AuraStatus.ERROR },
      });

      throw error;
    }
  }

  private logTiming(message: string): void {
    if (!this.timingLogsEnabled) return;
    console.log(`[AuraTiming] ${message}`);
  }

  private formatDuration(durationMs: number): string {
    return `${durationMs}ms/${(durationMs / 1000).toFixed(2)}s`;
  }
}
