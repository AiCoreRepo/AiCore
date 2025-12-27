import { Processor, Process } from '@nestjs/bull';
import type bull from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { GeminiAIService } from '../common/gemini-ai.service';
import { AuraJobData } from './aura-queue.service';
import { AuraStatus } from '@prisma/client';
import { QUEUE_NAMES, JOB_NAMES } from '../common/constants/queue.constants';

@Processor(QUEUE_NAMES.AURA_GENERATION)
export class AuraProcessor {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService,
        private readonly geminiAI: GeminiAIService,
    ) {
        console.log('✅ [AuraProcessor] Processor initialized for queue:', QUEUE_NAMES.AURA_GENERATION);
    }

    @Process(JOB_NAMES.GENERATE_AVATARS)
    async handleAuraGeneration(job: bull.Job<AuraJobData>) {
        const { auraId, imageUrl, attributes } = job.data;

        try {
            console.log(`\n🚀 [Aura Processor] Starting avatar generation for Aura: ${auraId}`);

            // Generate avatar image directly using Gemini AI
            await job.progress(20);
            console.log(`🎨 [Aura Processor] Generating avatar with Gemini...`);

            const imageGeneration = await this.geminiAI.generateAvatarImage({
                imageUrl,
                attributes,
            });

            let finalAvatarUrl: string;
            let avatarMetadata: any;

            if (imageGeneration.success && imageGeneration.imageBase64) {
                // Generated image - upload to Cloudinary
                await job.progress(50);
                console.log(`📤 [Aura Processor] Uploading generated avatar...`);
                const base64Image = `data:image/png;base64,${imageGeneration.imageBase64}`;
                finalAvatarUrl = await this.cloudinary.uploadImage(base64Image);
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

                avatarMetadata = {
                    type: 'original',
                    processedAt: new Date().toISOString(),
                    attributes,
                };
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
                    generated_avatar_urls: [finalAvatarUrl],
                    attributes: avatarMetadata as any,
                },
            });

            console.log(`✅ [Aura Processor] Avatar ready: ${auraId}`);
            console.log(`   - URL: ${updatedAura.model_url}`);
            console.log(`   - Status: ${updatedAura.status}\n`);

            await job.progress(100);

            return {
                success: true,
                auraId,
                avatar: {
                    url: finalAvatarUrl,
                    type: avatarMetadata.type,
                },
                aura: {
                    aura_id: updatedAura.aura_id,
                    status: updatedAura.status,
                    model_url: updatedAura.model_url,
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
