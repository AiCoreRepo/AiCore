import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TryOnPermissionGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || user.role === 'ADMIN') {
            return true; // Admins always allowed
        }

        const dbUser = await this.prisma.user.findUnique({
            where: { user_id: user.user_id },
            select: {
                try_on_permission: true,
                try_ons_used: true,
                max_try_ons: true,
            },
        });

        if (!dbUser || dbUser.try_on_permission !== 'APPROVED') {
            throw new ForbiddenException('You do not have permission to use Virtual Try-On. Please request access.');
        }

        const effectiveTryOnLimit = Math.min(dbUser.max_try_ons, 3);
        if (dbUser.try_ons_used >= effectiveTryOnLimit) {
            throw new ForbiddenException(
                `Virtual Try-On limit reached. You can use it up to ${effectiveTryOnLimit} times.`
            );
        }

        return true;
    }
}
