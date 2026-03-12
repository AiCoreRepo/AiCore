import { Injectable } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import type bull from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { GeminiAIService } from '../common/gemini-ai.service';
import { ImageOptimizerService } from '../common/image-optimizer.service';
import { AuraJobData } from './aura-queue.service';
import { AuraStatus } from '@prisma/client';
import { QUEUE_NAMES, JOB_NAMES } from '../common/constants/queue.constants';

@Injectable()
@Processor(QUEUE_NAMES.AURA_GENERATION)
export class AuraProcessor {
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
  }

  @Process(JOB_NAMES.GENERATE_AVATARS)
  async handleAuraGeneration(job: bull.Job<AuraJobData>) {
    const { auraId, userId, imageUrl, attributes } = job.data;

    try {
      console.log(
        `\n🚀 [Aura Processor] Starting avatar generation for Aura: ${auraId}`,
      );

      // Generate avatar image directly using Gemini AI
      await job.progress(20);
      console.log(`🎨 [Aura Processor] Generating avatar with Gemini...`);

      const imageGeneration = await this.geminiAI.generateAvatarImage({
        imageUrl,
        attributes,
      });

      let finalAvatarUrl: string;
      let tryOnAvatarUrl: string;
      let avatarMetadata: any;
      let tryOnCropSource: string;

      if (imageGeneration.success && imageGeneration.imageBase64) {
        // Generated image - upload to Cloudinary
        await job.progress(50);
        console.log(`📤 [Aura Processor] Uploading generated avatar...`);
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
        finalAvatarUrl = avatarUpload.secureUrl;
        tryOnCropSource = base64Image;
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
        finalAvatarUrl = imageUrl;
        tryOnCropSource = imageUrl;

        avatarMetadata = {
          type: 'original',
          processedAt: new Date().toISOString(),
          attributes,
        };
      }

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

      await job.progress(70);

      // Update database
      console.log(`💾 [Aura Processor] Updating database...`);
      await job.progress(90);

      const updatedAura = await this.prisma.aura.update({
        where: { aura_id: auraId },
        data: {
          status: AuraStatus.READY,
          model_url: finalAvatarUrl,
          tryon_model_url: tryOnAvatarUrl,
          generated_avatar_urls: Array.from(
            new Set([finalAvatarUrl, tryOnAvatarUrl]),
          ),
          attributes: {
            ...avatarMetadata,
            tryOnCrop: {
              url: tryOnAvatarUrl,
              cropBottomPercent: 12,
            },
          },
        },
      });

      console.log(`✅ [Aura Processor] Avatar ready: ${auraId}`);
      console.log(`   - URL: ${updatedAura.model_url}`);
      console.log(`   - Try-on crop URL: ${updatedAura.tryon_model_url}`);
      console.log(`   - Status: ${updatedAura.status}\n`);

      await job.progress(100);

      return {
        success: true,
        auraId,
        avatar: {
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

      await this.prisma.aura.update({
        where: { aura_id: auraId },
        data: { status: AuraStatus.ERROR },
      });

      throw error;
    }
  }
}
