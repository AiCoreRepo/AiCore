import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { CreateAuraDto } from './dto/create-aura.dto';
import { AuraStatus } from '@prisma/client';

@Injectable()
export class AuraService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService,
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
            const imageUrl = await this.cloudinary.uploadImage(base64Image);

            // Create Aura record
            const aura = await this.prisma.aura.create({
                data: {
                    user_id: userId,
                    image_url: imageUrl,
                    height_cm: attributes.height,
                    weight_kg: attributes.weight,
                    skin_tone: attributes.skinTone,
                    gender: attributes.gender,
                    body_shape: attributes.bodyShape,
                    age_range: attributes.ageRange,
                    hair_style: attributes.hairStyle,
                    status: AuraStatus.READY, // Set to READY immediately (no AI processing yet)
                },
            });

            return {
                aura_id: aura.aura_id,
                user_id: aura.user_id,
                image_url: aura.image_url,
                status: aura.status,
                created_at: aura.created_at,
            };
        } catch (error) {
            console.error('Error creating Aura:', error);
            throw new InternalServerErrorException('Failed to create Aura. Please try again.');
        }
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
                created_at: true,
            },
        });

        return {
            hasAura: !!aura,
            aura: aura || null,
        };
    }
}
