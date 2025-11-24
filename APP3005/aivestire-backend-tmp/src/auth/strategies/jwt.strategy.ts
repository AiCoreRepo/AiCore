import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret',
    });
  }

  async validate(payload: { sub: string }) {
    console.log('JWT payload:', payload);
    const user = await this.prisma.user.findUnique({
      where: { user_id: payload.sub },
    });
    if (!user) {
      console.log('User not found for sub:', payload.sub);
      throw new UnauthorizedException();
    }
    console.log('Authenticated user:', {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    });
    return { user_id: user.user_id, email: user.email, role: user.role };
  }
}
