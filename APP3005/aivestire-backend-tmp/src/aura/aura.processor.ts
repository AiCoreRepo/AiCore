import { Injectable } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import type bull from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { GeminiAIService } from '../common/gemini-ai.service';
import { AuraJobData } from './aura-queue.service';
import { AuraStatus } from '@prisma/client';
import { QUEUE_NAMES, JOB_NAMES } from '../common/constants/queue.constants';
import {
  buildAuraAttributesMetadata,
  createAuraAvatarHistoryEntry,
  getAuraAttributeSnapshotFromRecord,
  normalizeAuraAvatarHistory,
} from './aura-avatar-history.util';

@Injectable()
@Processor(QUEUE_NAMES.AURA_GENERATION)
export class AuraProcessor {
  private readonly timingLogsEnabled =
    String(process.env.AI_TIMING_LOGS || '').toLowerCase() === 'true';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly geminiAI: GeminiAIService,
  ) {
    console.log(
      '✅ [AuraProcessor] Processor initialized for queue:',
      QUEUE_NAMES.AURA_GENERATION,
    );
  }

  @Process(JOB_NAMES.GENERATE_AVATARS)
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
      let generatedUploadMs = 0;
      let dbUpdateMs = 0;

      console.log(
        `\n🚀 [Aura Processor] Starting avatar generation for Aura: ${auraId}`,
      );

      let sourceImageUrl = imageUrl || '';

      if (sourceImageData) {
        await job.progress(10);
        console.log(`📤 [Aura Processor] Uploading source image...`);
        const sourceUploadStart = Date.now();
        const sourceUpload = await this.cloudinary.uploadWithMetadata(
          sourceImageData,
          {
            userId,
            auraId,
            imageType: 'avatar',
            avatarVariant: 'source',
            source: sourceImageMimeType || 'user-upload',
          },
          'avatars/source',
        );
        sourceUploadMs = Date.now() - sourceUploadStart;
        sourceImageUrl = sourceUpload.secureUrl;

        await this.prisma.aura.update({
          where: { aura_id: auraId },
          data: {
            image_url: sourceImageUrl,
          },
        });
      }

      if (!sourceImageUrl) {
        throw new Error('No source image available for avatar generation');
      }

      // Generate avatar image directly using Gemini AI
      await job.progress(20);
      console.log(`🎨 [Aura Processor] Generating avatar with Gemini...`);
      const geminiStart = Date.now();

      const imageGeneration = await this.geminiAI.generateAvatarImage({
        imageUrl: sourceImageUrl,
        attributes,
      });
      geminiMs = Date.now() - geminiStart;

      let finalAvatarUrl: string;
      let tryOnAvatarUrl: string;
      let avatarMetadata: any;

      if (imageGeneration.success && imageGeneration.imageBase64) {
        // Generated image - upload to Cloudinary
        await job.progress(50);
        console.log(`📤 [Aura Processor] Uploading generated avatar...`);
        const generatedUploadStart = Date.now();
        const base64Image = `data:image/png;base64,${imageGeneration.imageBase64}`;
        const avatarUpload = await this.cloudinary.uploadWithMetadata(
          base64Image,
          {
            userId,
            auraId,
            imageType: 'avatar',
            avatarVariant: 'full',
            source: 'gemini-generated',
          },
          'avatars',
        );
        generatedUploadMs = Date.now() - generatedUploadStart;
        finalAvatarUrl = avatarUpload.secureUrl;
        console.log(`✅ [Aura Processor] Generated avatar uploaded`);

        avatarMetadata = {
          type: 'generated',
          generatedAt: new Date().toISOString(),
          attributes,
        };
      } else {
        // Use original image
        await job.progress(50);
        console.log(`ℹ️  [Aura Processor] Using original image`);
        finalAvatarUrl = sourceImageUrl;

        avatarMetadata = {
          type: 'original',
          processedAt: new Date().toISOString(),
          attributes,
        };
      }

      // Direct try-on now uses the full avatar URL instead of a cropped try-on variant.
      tryOnAvatarUrl = finalAvatarUrl;

      /*
      try {
        console.log(`✂️ [Aura Processor] Creating try-on crop without footwear...`);
        const croppedAvatarBase64 =
          await this.imageOptimizer.cropAvatarForTryOn(tryOnCropSource);
        const croppedAvatarUpload = await this.cloudinary.uploadWithMetadata(
          croppedAvatarBase64,
          {
            userId,
            auraId,
            imageType: 'avatar',
            avatarVariant: 'try-on-cropped',
            cropBottomPercent: 12,
            sourceModelUrl: finalAvatarUrl,
          },
          'avatars/tryon-crops',
        );
        tryOnAvatarUrl = croppedAvatarUpload.secureUrl;
        console.log(`✅ [Aura Processor] Cropped try-on avatar uploaded`);
      } catch (cropError: any) {
        console.warn(
          `⚠️ [Aura Processor] Try-on crop failed, falling back to full avatar: ${cropError.message}`,
        );
        tryOnAvatarUrl = finalAvatarUrl;
      }
      */

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

      const updatedAura = await this.prisma.aura.update({
        where: { aura_id: auraId },
        data: {
          status: AuraStatus.READY,
          image_url: sourceImageUrl,
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
        `auraId=${auraId} total=${this.formatDuration(Date.now() - totalStartTime)} source_upload=${this.formatDuration(sourceUploadMs)} gemini=${this.formatDuration(geminiMs)} generated_upload=${this.formatDuration(generatedUploadMs)} db_update=${this.formatDuration(dbUpdateMs)} generation_type=${avatarMetadata.type}`,
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
    if (!this.timingLogsEnabled) {
      return;
    }

    console.log(`[AuraTiming] ${message}`);
  }

  private formatDuration(durationMs: number): string {
    return `${durationMs}ms/${(durationMs / 1000).toFixed(2)}s`;
  }
}
