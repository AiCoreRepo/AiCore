import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

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

    // If creator profile doesn't exist, create one
    if (!creator) {
      // Get user info to create store name
      const user = await this.prisma.user.findUnique({
        where: { user_id: userId },
        select: { email: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Create creator profile with default values
      // Use email username as store name (before @)
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
}
