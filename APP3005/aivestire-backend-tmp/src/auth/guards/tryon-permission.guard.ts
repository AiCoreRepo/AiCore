import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TryOnPermissionGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Please login to use Virtual Try-On');
    }

    if (user.role === 'ADMIN') {
      return true;
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { user_id: user.user_id },
      select: {
        try_ons_used: true,
        max_try_ons: true,
      },
    });

    if (!dbUser) {
      throw new ForbiddenException('User account not found');
    }

    const effectiveTryOnLimit =
      typeof dbUser.max_try_ons === 'number' && dbUser.max_try_ons > 0
        ? dbUser.max_try_ons
        : 3;

    if (dbUser.try_ons_used >= effectiveTryOnLimit) {
      throw new ForbiddenException(
        {
          message: `You have used all ${effectiveTryOnLimit} virtual try-ons. Upgrade to Premium for more try-ons.`,
          code: 'TRY_ON_LIMIT_REACHED',
          tryOnsUsed: dbUser.try_ons_used,
          maxTryOns: effectiveTryOnLimit,
          upgradeRequired: true,
        },
      );
    }

    return true;
  }
}
