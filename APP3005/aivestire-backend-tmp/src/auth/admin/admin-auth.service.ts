import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminAuthService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Verify admin secret and issue admin JWT
   */
  async verifySecretAndIssueToken(
    email: string,
    secret: string,
  ): Promise<{ token: string }> {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminEmail || !adminSecret) {
      throw new ForbiddenException('Admin configuration is missing');
    }

    if (email !== adminEmail) {
      throw new UnauthorizedException('Access denied. Invalid admin email.');
    }

    if (secret !== adminSecret) {
      throw new UnauthorizedException('Invalid admin secret.');
    }

    // Sign JWT with admin-specific secret
    const token = this.jwtService.sign(
      { email, role: 'admin' },
      {
        secret: process.env.ADMIN_JWT_SECRET,
        expiresIn: '30m',
      },
    );

    return { token };
  }
}
