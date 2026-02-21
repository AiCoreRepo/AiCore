import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuraStatus } from '@prisma/client';

@Injectable()
export class AuraGateGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) {
      return false;
    }

    const aura = await this.prisma.aura.findFirst({
      where: { user_id: user.user_id, status: { not: AuraStatus.ERROR } },
      orderBy: { created_at: 'desc' },
    });

    if (!aura) {
      throw new ForbiddenException({
        code: 'AURA_REQUIRED',
        message: 'Create your Aura to use AI Try-On',
        auraExists: false,
        status: 'none',
      });
    }

    if (aura.status !== AuraStatus.READY) {
      throw new ForbiddenException({
        code: 'AURA_NOT_READY',
        message: 'Your Aura is still processing',
        auraExists: true,
        status: aura.status,
      });
    }

    // attach aura to request for downstream handlers
    req.aura = aura;
    return true;
  }
}
