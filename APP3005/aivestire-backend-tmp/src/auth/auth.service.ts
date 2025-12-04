import { JwtService } from '@nestjs/jwt';
// Type guard for bcrypt module
function isBcryptModule(mod: unknown): mod is typeof import('bcrypt') {
  return (
    typeof mod === 'object' && mod !== null && 'hash' in mod && 'compare' in mod
  );
}
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as crypto from 'crypto';
import {
  REFRESH_TOKEN_COOKIE_OPTIONS,
  JWT_ACCESS_TOKEN_EXPIRES_IN,
} from '../common/constants';

// Dynamic import for bcrypt to avoid require and type issues
let bcryptPromise: Promise<typeof import('bcrypt')> | null = null;
function getBcrypt(): Promise<typeof import('bcrypt')> {
  if (!bcryptPromise) {
    bcryptPromise = import('bcrypt');
  }
  return bcryptPromise;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  private slugify(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new BadRequestException('Email already registered');
    }
    const bcryptMod1 = await getBcrypt();
    if (!isBcryptModule(bcryptMod1)) {
      throw new Error('Failed to load bcrypt module');
    }
    const password_hash: string = await bcryptMod1.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password_hash,
        role: dto.role,
      },
    });

    if (user.role === UserRole.CREATOR) {
      const storeName = `${user.email.split('@')[0]} Store`;
      let storeSlug = this.slugify(storeName);
      let i = 1;
      while (
        await this.prisma.creator.findUnique({
          where: { store_slug: storeSlug },
        })
      ) {
        storeSlug = `${this.slugify(storeName)}-${i++}`;
      }

      await this.prisma.creator.create({
        data: {
          user_id: user.user_id,
          store_name: storeName,
          store_slug: storeSlug,
          verified: true,
          verification_data: {
            autoCreated: true,
            timestamp: new Date().toISOString(),
          },
        },
      });
    }
    return {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password_hash) return null;
    const bcryptMod2 = await getBcrypt();
    if (!isBcryptModule(bcryptMod2)) {
      throw new Error('Failed to load bcrypt module');
    }
    const valid: boolean = await bcryptMod2.compare(
      password,
      user.password_hash,
    );
    return valid ? user : null;
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.issueTokens(user.user_id, user.role);
    // Hash and store refresh token
    const bcryptMod3 = await getBcrypt();
    if (!isBcryptModule(bcryptMod3)) {
      throw new Error('Failed to load bcrypt module');
    }
    const refresh_token_hash: string = await bcryptMod3.hash(
      tokens.refresh_token,
      10,
    );
    await this.prisma.user.update({
      where: { user_id: user.user_id },
      data: { refresh_token_hash },
    });
    // Set HttpOnly cookie for refresh token
    res.cookie(
      'refresh_token',
      tokens.refresh_token,
      REFRESH_TOKEN_COOKIE_OPTIONS,
    );
    return {
      access_token: tokens.access_token,
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refresh(user_id: string, refresh_token: string, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { user_id } });
    if (!user || !user.refresh_token_hash) {
      throw new UnauthorizedException();
    }
    const bcryptMod4 = await getBcrypt();
    if (!isBcryptModule(bcryptMod4)) {
      throw new Error('Failed to load bcrypt module');
    }
    const valid: boolean = await bcryptMod4.compare(
      refresh_token,
      user.refresh_token_hash,
    );
    if (!valid) {
      throw new ForbiddenException('Invalid refresh token');
    }
    // Rotate refresh token
    const tokens = await this.issueTokens(user.user_id, user.role);
    const bcryptMod5 = await getBcrypt();
    if (!isBcryptModule(bcryptMod5)) {
      throw new Error('Failed to load bcrypt module');
    }
    const refresh_token_hash: string = await bcryptMod5.hash(
      tokens.refresh_token,
      10,
    );
    await this.prisma.user.update({
      where: { user_id: user.user_id },
      data: { refresh_token_hash },
    });
    res.cookie(
      'refresh_token',
      tokens.refresh_token,
      REFRESH_TOKEN_COOKIE_OPTIONS,
    );
    return {
      access_token: tokens.access_token,
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async logout(user_id: string, res: Response) {
    await this.prisma.user.update({
      where: { user_id },
      data: { refresh_token_hash: null },
    });
    res.clearCookie('refresh_token', REFRESH_TOKEN_COOKIE_OPTIONS);
    return { message: 'Logged out' };
  }

  async getProfile(user_id: string) {
    const user = await this.prisma.user.findUnique({
      where: { user_id },
      include: {
        creatorProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // If the user is a creator, return their creator profile details
    if (user.role === UserRole.CREATOR && user.creatorProfile) {
      return {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        store_name: user.creatorProfile.store_name,
        // Add other creator-specific fields you might need
      };
    }

    // For other roles or non-creator users, return basic user info
    return {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    };
  }

  async issueTokens(user_id: string, role: string) {
    const payload = { sub: user_id, role };
    let access_token: string;
    try {
      access_token = await this.jwtService.signAsync(payload, {
        expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN,
      });
    } catch {
      throw new BadRequestException('JWT signing failed');
    }
    // Use random string for refresh token, store only hash
    const refresh_token = crypto.randomBytes(64).toString('hex');
    return { access_token, refresh_token };
  }
  /**
   * Simple creator login: if user exists, set role to creator; if not, create user as creator. No approval/verification.
   */
  async simpleCreatorLogin(email: string, res: Response) {
    // Try to find user by email
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Create user as creator
      user = await this.prisma.user.create({
        data: {
          email,
          role: UserRole.CREATOR,
          status: 'active',
        },
      });
      // Optionally, create a Creator profile (minimal)
      await this.prisma.creator.create({
        data: {
          user_id: user.user_id,
          store_name: `${email.split('@')[0]}'s Store`,
          store_slug: this.slugify(`${email.split('@')[0]}-store`),
          verified: true,
        },
      });
    } else if (user.role !== UserRole.CREATOR) {
      // If user exists but is not a creator, update role
      user = await this.prisma.user.update({
        where: { user_id: user.user_id },
        data: { role: UserRole.CREATOR },
      });
      // Ensure Creator profile exists
      const creatorProfile = await this.prisma.creator.findUnique({
        where: { user_id: user.user_id },
      });
      if (!creatorProfile) {
        await this.prisma.creator.create({
          data: {
            user_id: user.user_id,
            store_name: `${email.split('@')[0]}'s Store`,
            store_slug: this.slugify(`${email.split('@')[0]}-store`),
            verified: true,
          },
        });
      }
    }
    // Issue tokens
    const tokens = await this.issueTokens(user.user_id, UserRole.CREATOR);
    // Set refresh token hash
    const bcryptMod = await getBcrypt();
    if (!isBcryptModule(bcryptMod)) {
      throw new Error('Failed to load bcrypt module');
    }
    const refresh_token_hash: string = await bcryptMod.hash(
      tokens.refresh_token,
      10,
    );
    await this.prisma.user.update({
      where: { user_id: user.user_id },
      data: { refresh_token_hash },
    });
    res.cookie(
      'refresh_token',
      tokens.refresh_token,
      REFRESH_TOKEN_COOKIE_OPTIONS,
    );
    return {
      access_token: tokens.access_token,
      user: {
        user_id: user.user_id,
        email: user.email,
        role: 'creator',
      },
    };
  }
}
