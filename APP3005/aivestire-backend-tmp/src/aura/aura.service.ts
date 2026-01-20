import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { AuraQueueService } from './aura-queue.service';
import { CreateAuraDto } from './dto/create-aura.dto';
import { AuraStatus } from '@prisma/client';

@Injectable()
export class AuraService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService,
        private readonly auraQueue: AuraQueueService,
    ) { }

    async createAura(userId: string, file: Express.Multer.File, attributes: CreateAuraDto) {
        // Check if user already has an Aura
        const existingAura = await this.prisma.aura.findUnique({
            where: { user_id: userId },
        });

        if (existingAura) {
            throw new ConflictException('User already has an Aura. Only one Aura per user is allowed.');
        }

        try {
            // Convert buffer to base64 data URI for Cloudinary
            const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

            // Upload to Cloudinary
            console.log('📤 Uploading image to Cloudinary...');
            const imageUrl = await this.cloudinary.uploadImage(base64Image);
            console.log('✅ Image uploaded:', imageUrl);

            // Create Aura record with PENDING status
            const aura = await this.prisma.aura.create({
                data: {
                    user_id: userId,
                    image_url: imageUrl,
                    height_cm: attributes.height,
                    weight_kg: attributes.weight,
                    skin_tone: attributes.skinTone,
                    gender: attributes.gender,
                    body_shape: attributes.bodyShape,
                    body_type: attributes.bodyType, // Added mapping
                    age_range: attributes.ageRange,
                    hair_style: attributes.hairStyle,
                    status: AuraStatus.PENDING, // Changed from READY
                },
            });

            console.log('✅ Aura created with PENDING status:', aura.aura_id);

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
                job_id: job.id.toString(), // Return job ID for polling
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
            // Delete images from Cloudinary
            const imagesToDelete: string[] = [];

            // Add original image URL
            if (existingAura.image_url) {
                imagesToDelete.push(existingAura.image_url);
            }

            // Add model URL (AI generated avatar)
            if (existingAura.model_url) {
                imagesToDelete.push(existingAura.model_url);
            }

            // Add any generated avatar URLs
            if (existingAura.generated_avatar_urls && existingAura.generated_avatar_urls.length > 0) {
                imagesToDelete.push(...existingAura.generated_avatar_urls);
            }

            // Delete all images from Cloudinary
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
}
