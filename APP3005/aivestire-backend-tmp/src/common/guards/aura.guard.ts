import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuraStatus } from '@prisma/client';

/**
 * Aura Guard - Validates that user has a READY Aura before accessing endpoint
 */
@Injectable()
export class AuraGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId =
      request.body?.userId || request.params?.userId || request.query?.userId;

    if (!userId) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }

    // Check if user has Aura
    const aura = await this.prisma.aura.findUnique({
      where: { user_id: userId.toString() },
    });

    if (!aura) {
      throw new HttpException(
        'No Aura found. Please create your Aura first.',
        HttpStatus.FORBIDDEN,
      );
    }

    // Check if Aura is READY
    if (aura.status !== AuraStatus.READY) {
      throw new HttpException(
        `Aura is not ready (status: ${aura.status}). Please wait for Aura generation to complete.`,
        HttpStatus.FORBIDDEN,
      );
    }

    // Check if Aura has image
    if (!aura.image_url) {
      throw new HttpException(
        'Aura image not available.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Attach Aura to request for use in controller/service
    request.aura = aura;

    return true;
  }
}
