import { Injectable } from '@nestjs/common';
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
}
