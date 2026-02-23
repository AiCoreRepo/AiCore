import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { AuraQueueService } from './aura-queue.service';
import { CreateAuraDto } from './dto/create-aura.dto';
import { AuraStatus, Prisma } from '@prisma/client';

@Injectable()
export class AuraService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService,
        private readonly auraQueue: AuraQueueService,
    ) { }

    async createAura(userId: string, file: Express.Multer.File, attributes: CreateAuraDto) {
        const existingAura = await this.prisma.aura.findUnique({
            where: { user_id: userId },
        });
        const userLimits = await this.prisma.user.findUnique({
            where: { user_id: userId },
            select: {
                has_created_aura: true,
                max_avatar_regenerations: true,
                avatar_regenerations_used: true,
            },
        });

        if (!userLimits) {
            throw new ConflictException('User not found');
        }

        const isRegeneration = userLimits.has_created_aura;
        if (isRegeneration && userLimits.avatar_regenerations_used >= userLimits.max_avatar_regenerations) {
            throw new ConflictException(
                `Avatar regeneration limit reached. You can regenerate up to ${userLimits.max_avatar_regenerations} times.`
            );
        }

        try {
            // Convert buffer to base64 data URI for Cloudinary
            const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

            // Upload to Cloudinary
            console.log('📤 Uploading image to Cloudinary...');
            const imageUrl = await this.cloudinary.uploadImage(base64Image);
            console.log('✅ Image uploaded:', imageUrl);

            // If aura already exists, recycle it so users can re-create avatars.
            const aura = await this.prisma.$transaction(async (tx) => {
                const savedAura = existingAura
                    ? await tx.aura.update({
                        where: { user_id: userId },
                        data: {
                            image_url: imageUrl,
                            height_cm: attributes.height,
                            weight_kg: attributes.weight,
                            skin_tone: attributes.skinTone,
                            gender: attributes.gender,
                            body_shape: attributes.bodyShape,
                            body_type: attributes.bodyType,
                            body_size: attributes.bodySize,
                            age_range: attributes.ageRange,
                            hair_style: attributes.hairStyle,
                            model_url: null,
                            generated_avatar_urls: [],
                            attributes: Prisma.JsonNull,
                            status: AuraStatus.PENDING,
                        },
                    })
                    : await tx.aura.create({
                        data: {
                            user_id: userId,
                            image_url: imageUrl,
                            height_cm: attributes.height,
                            weight_kg: attributes.weight,
                            skin_tone: attributes.skinTone,
                            gender: attributes.gender,
                            body_shape: attributes.bodyShape,
                            body_type: attributes.bodyType,
                            body_size: attributes.bodySize,
                            age_range: attributes.ageRange,
                            hair_style: attributes.hairStyle,
                            status: AuraStatus.PENDING,
                        },
                    });

                await tx.user.update({
                    where: { user_id: userId },
                    data: isRegeneration
                        ? { avatar_regenerations_used: { increment: 1 } }
                        : { has_created_aura: true },
                });

                return savedAura;
            });

            if (existingAura) {
                await this.deleteCloudinaryImages(existingAura);
                console.log('♻️ Existing Aura refreshed:', aura.aura_id);
            } else {
                console.log('✅ Aura created with PENDING status:', aura.aura_id);
            }

            // Add job to queue for background processing
            const job = await this.auraQueue.addAuraGenerationJob({
                auraId: aura.aura_id,
                userId: aura.user_id,
                imageUrl: aura.image_url || '',
                attributes: {
                    height: attributes.height || 170,
                    weight: attributes.weight || 70,
                    skinTone: attributes.skinTone || 'medium',
                    gender: attributes.gender || 'unspecified',
                    bodyShape: attributes.bodyShape || 'average',
                    ageRange: attributes.ageRange || '25-35',
                    hairStyle: attributes.hairStyle || 'short',
                },
            });

            console.log('✅ Job queued with ID:', job.id);

            return {
                aura_id: aura.aura_id,
                user_id: aura.user_id,
                image_url: aura.image_url,
                status: aura.status,
                job_id: job.id.toString(),
                created_at: aura.created_at,
            };
        } catch (error) {
            console.error('Error creating Aura:', error);
            throw new InternalServerErrorException('Failed to create Aura. Please try again.');
        }
    }

    async getJobStatus(jobId: string) {
        return this.auraQueue.getJobStatus(jobId);
    }

    async getAuraByUserId(userId: string) {
        return this.prisma.aura.findUnique({
            where: { user_id: userId },
        });
    }

    async hasAura(userId: string) {
        const aura = await this.prisma.aura.findUnique({
            where: { user_id: userId },
            select: {
                aura_id: true,
                status: true,
                image_url: true,
                model_url: true,
                generated_avatar_urls: true,
                created_at: true,
            },
        });

        return {
            hasAura: !!aura,
            aura: aura || null,
        };
    }

    async updateAura(userId: string, updateDto: any) {
        // Check if aura exists
        const existingAura = await this.prisma.aura.findUnique({
            where: { user_id: userId },
        });

        if (!existingAura) {
            throw new ConflictException('No Aura found for this user. Please create one first.');
        }

        try {
            // Update aura with new attributes
            const updatedAura = await this.prisma.aura.update({
                where: { user_id: userId },
                data: {
                    height_cm: updateDto.height,
                    weight_kg: updateDto.weight,
                    skin_tone: updateDto.skinTone,
                    gender: updateDto.gender,
                    body_shape: updateDto.bodyShape,
                    body_type: updateDto.bodyType, // Added mapping
                    body_size: updateDto.bodySize, // Added mapping for body size
                    age_range: updateDto.ageRange,
                    hair_style: updateDto.hairStyle,
                },
            });

            return updatedAura;
        } catch (error) {
            console.error('Error updating Aura:', error);
            throw new InternalServerErrorException('Failed to update Aura. Please try again.');
        }
    }

    async deleteAura(userId: string) {
        // Check if user has an Aura
        const existingAura = await this.prisma.aura.findUnique({
            where: { user_id: userId },
        });

        if (!existingAura) {
            throw new ConflictException('No Aura found for this user.');
        }

        try {
            await this.deleteCloudinaryImages(existingAura);

            // Delete Aura from database
            await this.prisma.aura.delete({
                where: { user_id: userId },
            });

            console.log('✅ Aura deleted successfully for user:', userId);

            return {
                success: true,
                message: 'Aura deleted successfully',
            };
        } catch (error) {
            console.error('Error deleting Aura:', error);
            throw new InternalServerErrorException('Failed to delete Aura. Please try again.');
        }
    }

    private async deleteCloudinaryImages(aura: {
        image_url: string | null;
        model_url: string | null;
        generated_avatar_urls: string[];
    }) {
        const imagesToDelete = Array.from(new Set([
            aura.image_url,
            aura.model_url,
            ...(aura.generated_avatar_urls || []),
        ].filter((url): url is string => Boolean(url))));

        if (imagesToDelete.length === 0) {
            return;
        }

        console.log('🗑️ Deleting images from Cloudinary:', imagesToDelete);
        for (const imageUrl of imagesToDelete) {
            try {
                await this.cloudinary.deleteImage(imageUrl);
                console.log('✅ Deleted:', imageUrl);
            } catch (error) {
                console.error('⚠️ Failed to delete image from Cloudinary:', imageUrl, error);
                // Continue even if Cloudinary deletion fails
            }
        }
    }
}
