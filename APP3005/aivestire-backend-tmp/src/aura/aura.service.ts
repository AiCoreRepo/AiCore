import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { AuraQueueService } from './aura-queue.service';
import { CreateAuraDto } from './dto/create-aura.dto';
import { AuraStatus } from '@prisma/client';
import { getEffectiveAvatarRecreationLimit } from '../auth/utils/try-on-limit.util';
import {
  buildAuraAttributesMetadata,
  collectAuraAvatarHistoryImageUrls,
  getAuraAttributeSnapshotFromRecord,
  normalizeAuraAvatarHistory,
} from './aura-avatar-history.util';

@Injectable()
export class AuraService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly auraQueue: AuraQueueService,
  ) {}

  private getAuraAttributeValue(
    valueFromPayload: string | undefined | null,
    valueFromAura: string | null | undefined,
    fallback: string,
  ): string {
    return (valueFromPayload || valueFromAura || '').trim() || fallback;
  }

  private getAuraAttributeNumber(
    valueFromPayload: number | undefined | null,
    valueFromAura: number | null | undefined,
    fallback: number,
  ): number {
    return typeof valueFromPayload === 'number'
      ? valueFromPayload
      : (valueFromAura ?? fallback);
  }

  private getMaxRecreationAttempts(
    maxAttemptsFromUser: number | null | undefined,
    request?: Request,
  ): number {
    return getEffectiveAvatarRecreationLimit(maxAttemptsFromUser, request);
  }

  private getRecreationLimitMessage(maxAttempts: number): string {
    if (maxAttempts <= 0) {
      return 'Aura recreation is not available for this account.';
    }

    if (maxAttempts === 1) {
      return 'You have already used your Aura recreation.';
    }

    return `You have reached your Aura recreation limit of ${maxAttempts}.`;
  }

  private formatAuraResponse(aura: Record<string, any> | null) {
    if (!aura) {
      return null;
    }

    const { avatarHistory, selectedAvatar, selectedAvatarId } =
      normalizeAuraAvatarHistory({
        attributesJson: aura.attributes,
        modelUrl: aura.model_url,
        tryOnModelUrl: aura.tryon_model_url,
        generatedAvatarUrls: aura.generated_avatar_urls,
        createdAt: aura.created_at,
        updatedAt: aura.updated_at,
        currentAttributes: getAuraAttributeSnapshotFromRecord(aura),
      });

    return {
      ...aura,
      model_url: selectedAvatar?.model_url || aura.model_url,
      tryon_model_url:
        selectedAvatar?.tryon_model_url ||
        aura.tryon_model_url ||
        selectedAvatar?.model_url ||
        aura.model_url,
      selected_avatar_id: selectedAvatarId,
      selected_avatar: selectedAvatar,
      avatar_history: avatarHistory,
    };
  }

  async createAura(
    userId: string,
    file: Express.Multer.File,
    attributes: CreateAuraDto,
  ) {
    // Check if user already has an Aura
    const existingAura = await this.prisma.aura.findUnique({
      where: { user_id: userId },
    });

    if (existingAura) {
      throw new ConflictException(
        'User already has an Aura. Only one Aura per user is allowed.',
      );
    }

    try {
      const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      // Create Aura record with PENDING status
      const aura = await this.prisma.aura.create({
        data: {
          user_id: userId,
          height_cm: attributes.height,
          weight_kg: attributes.weight,
          skin_tone: attributes.skinTone,
          gender: attributes.gender,
          body_shape: attributes.bodyShape,
          body_type: attributes.bodyType, // Added mapping
          body_size: attributes.bodySize, // Added mapping for body size
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
        sourceImageData: base64Image,
        sourceImageMimeType: file.mimetype,
        generationSource: 'creation',
        attributes: {
          height: attributes.height ?? 170,
          weight: attributes.weight ?? 70,
          skinTone: attributes.skinTone,
          gender: attributes.gender || 'unspecified',
          bodyShape: attributes.bodyShape,
          bodySize: attributes.bodySize,
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
      throw new InternalServerErrorException(
        'Failed to create Aura. Please try again.',
      );
    }
  }

  async getJobStatus(jobId: string) {
    return this.auraQueue.getJobStatus(jobId);
  }

  async recreateAura(
    userId: string,
    file: Express.Multer.File | undefined,
    attributes: CreateAuraDto,
    request?: Request,
  ) {
    const existingAura = await this.prisma.aura.findUnique({
      where: { user_id: userId },
    });

    if (!existingAura) {
      throw new ConflictException(
        'No Aura found for this user. Please create one first.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        avatar_regenerations_used: true,
        max_avatar_regenerations: true,
      },
    });

    if (!user) {
      throw new ConflictException('User not found.');
    }

    const maxRecreationAttempts = this.getMaxRecreationAttempts(
      user.max_avatar_regenerations,
      request,
    );

    if (user.avatar_regenerations_used >= maxRecreationAttempts) {
      throw new ConflictException(
        this.getRecreationLimitMessage(maxRecreationAttempts),
      );
    }

    let sourceImageUrl = existingAura.image_url || '';
    let sourceImageData: string | undefined;
    let sourceImageMimeType: string | undefined;

    if (file) {
      sourceImageData = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      sourceImageMimeType = file.mimetype;
    }

    if (!sourceImageUrl && !sourceImageData) {
      throw new BadRequestException(
        'No source image available for regeneration.',
      );
    }

    const updatePayload = {
      status: AuraStatus.PENDING as AuraStatus,
      ...(attributes.height ? { height_cm: attributes.height } : {}),
      ...(attributes.weight ? { weight_kg: attributes.weight } : {}),
      ...(attributes.skinTone ? { skin_tone: attributes.skinTone } : {}),
      ...(attributes.gender ? { gender: attributes.gender } : {}),
      ...(attributes.bodyShape ? { body_shape: attributes.bodyShape } : {}),
      ...(attributes.bodyType ? { body_type: attributes.bodyType } : {}),
      ...(attributes.bodySize ? { body_size: attributes.bodySize } : {}),
      ...(attributes.ageRange ? { age_range: attributes.ageRange } : {}),
      ...(attributes.hairStyle ? { hair_style: attributes.hairStyle } : {}),
    };

    try {
      await this.prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.updateMany({
          where: {
            user_id: userId,
            avatar_regenerations_used: {
              lt: maxRecreationAttempts,
            },
          },
          data: {
            avatar_regenerations_used: {
              increment: 1,
            },
          },
        });

        if (updatedUser.count === 0) {
          throw new ConflictException(
            this.getRecreationLimitMessage(maxRecreationAttempts),
          );
        }

        await tx.aura.update({
          where: { user_id: userId },
          data: updatePayload,
        });
      });

      const job = await this.auraQueue.addAuraGenerationJob({
        auraId: existingAura.aura_id,
        userId,
        imageUrl: sourceImageUrl,
        sourceImageData,
        sourceImageMimeType,
        generationSource: 'recreation',
        attributes: {
          height: this.getAuraAttributeNumber(
            attributes.height,
            existingAura.height_cm,
            170,
          ),
          weight: this.getAuraAttributeNumber(
            attributes.weight,
            existingAura.weight_kg,
            70,
          ),
          skinTone: this.getAuraAttributeValue(
            attributes.skinTone,
            existingAura.skin_tone,
            'medium',
          ),
          gender: this.getAuraAttributeValue(
            attributes.gender,
            existingAura.gender,
            'unspecified',
          ),
          bodyShape: this.getAuraAttributeValue(
            attributes.bodyShape,
            existingAura.body_shape,
            'average',
          ),
          bodySize: this.getAuraAttributeValue(
            attributes.bodySize,
            existingAura.body_size,
            'medium',
          ),
          ageRange: this.getAuraAttributeValue(
            attributes.ageRange,
            existingAura.age_range,
            '25-35',
          ),
          hairStyle: this.getAuraAttributeValue(
            attributes.hairStyle,
            existingAura.hair_style,
            'short',
          ),
        },
      });

      return {
        aura_id: existingAura.aura_id,
        status: AuraStatus.PENDING,
        job_id: job.id.toString(),
      };
    } catch (error) {
      console.error('Error recreating Aura:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to recreate Aura. Please try again.',
      );
    }
  }

  async getAuraByUserId(userId: string) {
    const aura = await this.prisma.aura.findUnique({
      where: { user_id: userId },
    });

    return this.formatAuraResponse(aura);
  }

  async selectAvatarForTryOns(userId: string, avatarId: string) {
    const aura = await this.prisma.aura.findUnique({
      where: { user_id: userId },
    });

    if (!aura) {
      throw new ConflictException(
        'No Aura found for this user. Please create one first.',
      );
    }

    const { avatarHistory } = normalizeAuraAvatarHistory({
      attributesJson: aura.attributes,
      modelUrl: aura.model_url,
      tryOnModelUrl: aura.tryon_model_url,
      generatedAvatarUrls: aura.generated_avatar_urls,
      createdAt: aura.created_at,
      updatedAt: aura.updated_at,
      currentAttributes: getAuraAttributeSnapshotFromRecord(aura),
    });

    const selectedAvatar = avatarHistory.find(
      (avatar) => avatar.avatar_id === avatarId,
    );

    if (!selectedAvatar) {
      throw new BadRequestException(
        'Selected avatar was not found for this Aura profile.',
      );
    }

    const updatedAura = await this.prisma.aura.update({
      where: { user_id: userId },
      data: {
        model_url: selectedAvatar.model_url,
        tryon_model_url: selectedAvatar.tryon_model_url,
        attributes: buildAuraAttributesMetadata(
          aura.attributes,
          avatarHistory,
          selectedAvatar,
        ) as any,
      },
    });

    return this.formatAuraResponse(updatedAura);
  }

  async hasAura(userId: string) {
    const aura = await this.prisma.aura.findUnique({
      where: { user_id: userId },
      select: {
        aura_id: true,
        status: true,
        image_url: true,
        model_url: true,
        tryon_model_url: true,
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
      throw new ConflictException(
        'No Aura found for this user. Please create one first.',
      );
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

      return this.formatAuraResponse(updatedAura);
    } catch (error) {
      console.error('Error updating Aura:', error);
      throw new InternalServerErrorException(
        'Failed to update Aura. Please try again.',
      );
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
      const imagesToDelete = new Set<string>();
      const { avatarHistory } = normalizeAuraAvatarHistory({
        attributesJson: existingAura.attributes,
        modelUrl: existingAura.model_url,
        tryOnModelUrl: existingAura.tryon_model_url,
        generatedAvatarUrls: existingAura.generated_avatar_urls,
        createdAt: existingAura.created_at,
        updatedAt: existingAura.updated_at,
        currentAttributes: getAuraAttributeSnapshotFromRecord(existingAura),
      });

      // Add original image URL
      if (existingAura.image_url) {
        imagesToDelete.add(existingAura.image_url);
      }

      // Add model URL (AI generated avatar)
      if (existingAura.model_url) {
        imagesToDelete.add(existingAura.model_url);
      }

      // Add footwear-removed try-on avatar
      if (existingAura.tryon_model_url) {
        imagesToDelete.add(existingAura.tryon_model_url);
      }

      // Add any generated avatar URLs
      if (
        existingAura.generated_avatar_urls &&
        existingAura.generated_avatar_urls.length > 0
      ) {
        existingAura.generated_avatar_urls.forEach((url) =>
          imagesToDelete.add(url),
        );
      }

      for (const imageUrl of collectAuraAvatarHistoryImageUrls(avatarHistory)) {
        imagesToDelete.add(imageUrl);
      }

      // Delete all images from Cloudinary
      const imageUrls = Array.from(imagesToDelete);
      console.log('🗑️ Deleting images from Cloudinary:', imageUrls);
      for (const imageUrl of imageUrls) {
        try {
          await this.cloudinary.deleteImage(imageUrl);
          console.log('✅ Deleted:', imageUrl);
        } catch (error) {
          console.error(
            '⚠️ Failed to delete image from Cloudinary:',
            imageUrl,
            error,
          );
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
      throw new InternalServerErrorException(
        'Failed to delete Aura. Please try again.',
      );
    }
  }
}
