import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';
import { SaveCreatorAddressDto } from './dto/creator-address.dto';

@Injectable()
export class CreatorsService {
  constructor(private prisma: PrismaService) {}

  async verifyCreator(
    creator_id: string,
    admin_user_id: string,
    verification_data?: unknown,
  ) {
    const jsonData =
      typeof verification_data === 'object' && verification_data !== null
        ? verification_data
        : {
            verifiedBy: admin_user_id,
            verifiedAt: new Date().toISOString(),
          };
    return this.prisma.creator.update({
      where: { creator_id },
      data: {
        verified: true,
        verification_data: jsonData as Prisma.InputJsonValue,
      },
    });
  }

  async getCreatorByUserId(userId: string) {
    let creator = await this.prisma.creator.findUnique({
      where: { user_id: userId },
    });

    if (!creator) {
      const user = await this.prisma.user.findUnique({
        where: { user_id: userId },
        select: { email: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const storeName = user.email.split('@')[0] || 'My Store';

      creator = await this.prisma.creator.create({
        data: {
          user_id: userId,
          store_name: storeName,
          store_slug: `store-${userId.substring(0, 8)}`,
          verified: false,
        },
      });
    }

    return creator;
  }

  async acceptTerms(creatorId: string, version: string = '1.0') {
    return this.prisma.creator.update({
      where: { creator_id: creatorId },
      data: {
        terms_accepted: true,
        terms_accepted_at: new Date(),
        terms_version: version,
      },
    });
  }

  async hasAcceptedTerms(creatorId: string): Promise<boolean> {
    const creator = await this.prisma.creator.findUnique({
      where: { creator_id: creatorId },
      select: { terms_accepted: true },
    });
    return creator?.terms_accepted || false;
  }

  async getTermsStatus(creatorId: string) {
    const creator = await this.prisma.creator.findUnique({
      where: { creator_id: creatorId },
      select: {
        terms_accepted: true,
        terms_accepted_at: true,
        terms_version: true,
      },
    });

    return {
      accepted: creator?.terms_accepted || false,
      acceptedAt: creator?.terms_accepted_at,
      version: creator?.terms_version,
    };
  }

  // ─── Creator Address ────────────────────────────────────────────────────────

  /**
   * Upsert the creator's business address.
   * Single write via unique creator_id constraint — no N+1.
   */
  async saveCreatorAddress(creatorId: string, dto: SaveCreatorAddressDto) {
    return this.prisma.creatorAddress.upsert({
      where: { creator_id: creatorId },
      create: {
        creator_id: creatorId,
        full_name: dto.full_name,
        phone: dto.phone,
        address_line1: dto.address_line1,
        address_line2: dto.address_line2,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        country: dto.country ?? 'India',
      },
      update: {
        full_name: dto.full_name,
        phone: dto.phone,
        address_line1: dto.address_line1,
        address_line2: dto.address_line2,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        country: dto.country ?? 'India',
      },
    });
  }

  /**
   * Fetch the creator's business address.
   * O(1) lookup via unique creator_id index — no N+1.
   */
  async getCreatorAddress(creatorId: string) {
    return this.prisma.creatorAddress.findUnique({
      where: { creator_id: creatorId },
    });
  }
}
