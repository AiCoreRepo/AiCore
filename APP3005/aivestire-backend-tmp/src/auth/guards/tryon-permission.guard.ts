import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TryOnPermissionGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role === 'ADMIN') {
      return true; // Admins always allowed
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { user_id: user.user_id },
      select: { try_on_permission: true },
    });

    if (!dbUser || dbUser.try_on_permission !== 'APPROVED') {
      throw new ForbiddenException(
        'You do not have permission to use Virtual Try-On. Please request access.',
      );
    }

    return true;
  }
}
