import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../auth/decorators/roles.decorator';
import type { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: { role?: string } }>();
    const { user } = req;
    if (!user || typeof user.role !== 'string') {
      console.log('No user or invalid user.role:', user);
      throw new ForbiddenException('Insufficient role');
    }
    if (!requiredRoles.includes(user.role)) {
      console.log(
        'User role not allowed:',
        user.role,
        'Required:',
        requiredRoles,
      );
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
