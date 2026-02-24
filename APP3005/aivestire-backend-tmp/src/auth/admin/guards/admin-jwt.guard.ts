import {
    Injectable,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminJwtGuard extends AuthGuard('admin-jwt') {
    handleRequest<T>(err: Error | null, user: T): T {
        if (err || !user) {
            throw new ForbiddenException(
                'Access denied. Admin authentication required.',
            );
        }
        return user;
    }
}
