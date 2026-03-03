import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';

/**
 * Extract admin JWT from the admin_token cookie
 */
function extractFromCookie(req: Request): string | null {
  if (req && req.cookies) {
    return req.cookies['admin_token'] || null;
  }
  return null;
}

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor() {
    super({
      jwtFromRequest: extractFromCookie,
      ignoreExpiration: false,
      secretOrKey: process.env.ADMIN_JWT_SECRET || 'admin-dev-secret',
    });
  }

  async validate(payload: { email: string; role: string }) {
    if (payload.role !== 'admin') {
      throw new UnauthorizedException('Not an admin');
    }
    return { email: payload.email, role: payload.role };
  }
}
