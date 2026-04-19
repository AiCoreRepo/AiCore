import { JwtService } from '@nestjs/jwt';
import { OtpService } from './otp.service';
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
  NotFoundException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, TryOnPermissionStatus } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { OAuth2Client } from 'google-auth-library';
import * as crypto from 'crypto';
import {
  REFRESH_TOKEN_COOKIE_OPTIONS,
  JWT_ACCESS_TOKEN_EXPIRES_IN,
} from '../common/constants';
import {
  getEffectiveAvatarRecreationLimit,
  getEffectiveTryOnLimit,
} from './utils/try-on-limit.util';
import { normalizeAuraAvatarHistory } from '../aura/utils/aura-avatar-history.util';

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
    private otpService: OtpService,
  ) {}

  private isAtLeastAge(dateOfBirth: Date, minimumAge: number): boolean {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDifference = today.getMonth() - dateOfBirth.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < dateOfBirth.getDate())
    ) {
      age--;
    }

    return age >= minimumAge;
  }

  private slugify(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private resolveAuraAvatarUrl(
    aura:
      | {
          image_url: string | null;
          model_url: string | null;
          tryon_model_url: string | null;
          generated_avatar_urls?: string[] | null;
          attributes?: unknown;
          created_at?: Date | null;
          updated_at?: Date | null;
        }
      | null
      | undefined,
  ): string | null {
    if (!aura) {
      return null;
    }

    const { selectedAvatar } = normalizeAuraAvatarHistory({
      attributesJson: aura.attributes,
      modelUrl: aura.model_url,
      tryOnModelUrl: aura.tryon_model_url,
      generatedAvatarUrls: aura.generated_avatar_urls ?? null,
      createdAt: aura.created_at,
      updatedAt: aura.updated_at,
    });

    return (
      selectedAvatar?.tryon_model_url ||
      selectedAvatar?.model_url ||
      aura.tryon_model_url ||
      aura.model_url ||
      aura.image_url ||
      null
    );
  }

  async register(dto: RegisterDto) {
    // Check if email already exists
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new BadRequestException('Email already registered');
    }

    // Check if phone number already exists for the SAME ROLE
    // This allows creators and buyers to use the same phone number independently
    if (dto.phoneNumber) {
      const phoneExists = await this.prisma.user.findFirst({
        where: {
          phone: dto.phoneNumber,
          role: dto.role, // Only check within the same role
        },
      });
      if (phoneExists) {
        throw new BadRequestException(
          `This phone number is already registered as a ${dto.role.toLowerCase()}`,
        );
      }
    }

    const bcryptMod1 = await getBcrypt();
    if (!isBcryptModule(bcryptMod1)) {
      throw new Error('Failed to load bcrypt module');
    }
    const password_hash: string = await bcryptMod1.hash(dto.password, 10);
    const dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    if (dateOfBirth && !this.isAtLeastAge(dateOfBirth, 13)) {
      throw new BadRequestException('You must be at least 13 years old');
    }
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password_hash,
        date_of_birth: dateOfBirth,
        phone: dto.phoneNumber,
        // Keep verified only when a phone number is explicitly supplied.
        phone_verified: !!dto.phoneNumber,
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

  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    const exists = await this.prisma.user.findUnique({
      where: { email },
    });
    return { available: !exists };
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
        try_on_permission: user.try_on_permission,
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
        try_on_permission: user.try_on_permission,
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

  async getProfile(user_id: string, request?: Request) {
    const user = await this.prisma.user.findUnique({
      where: { user_id },
      select: {
        user_id: true,
        email: true,
        role: true,
        password_hash: true,
        date_of_birth: true,
        try_on_permission: true,
        try_ons_used: true,
        max_try_ons: true,
        avatar_regenerations_used: true,
        max_avatar_regenerations: true,
        creatorProfile: {
          select: {
            store_name: true,
            verification_data: true,
          },
        },
        aura: {
          select: {
            image_url: true,
            model_url: true,
            tryon_model_url: true,
            generated_avatar_urls: true,
            attributes: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const effectiveTryOnLimit = getEffectiveTryOnLimit(
      user.max_try_ons,
      request,
    );
    const effectiveAvatarRecreationLimit = getEffectiveAvatarRecreationLimit(
      user.max_avatar_regenerations,
      request,
    );
    const auraAvatar = this.resolveAuraAvatarUrl(user.aura);

    // If the user is a creator, return their creator profile details
    if (user.role === UserRole.CREATOR && user.creatorProfile) {
      const verificationData = (user.creatorProfile.verification_data as any) || {};

      return {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        dob: user.date_of_birth?.toISOString().split('T')[0],
        needs_dob_collection: !user.date_of_birth && !user.password_hash,
        try_on_permission: user.try_on_permission,
        store_name: user.creatorProfile.store_name,
        subtitle: verificationData.subtitle || null,
        avatar: verificationData.avatar || auraAvatar || null,
        paymentDetails: verificationData.paymentDetails || null,
        try_ons_used: user.try_ons_used,
        max_try_ons: effectiveTryOnLimit,
        avatar_regenerations_used: user.avatar_regenerations_used,
        max_avatar_regenerations: effectiveAvatarRecreationLimit,
        // Add other creator-specific fields you might need
      };
    }

    // For other roles or non-creator users, return basic user info
    return {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      dob: user.date_of_birth?.toISOString().split('T')[0],
      needs_dob_collection: !user.date_of_birth && !user.password_hash,
      try_on_permission: user.try_on_permission,
      avatar: auraAvatar,
      try_ons_used: user.try_ons_used,
      max_try_ons: effectiveTryOnLimit,
      avatar_regenerations_used: user.avatar_regenerations_used,
      max_avatar_regenerations: effectiveAvatarRecreationLimit,
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
        try_on_permission: user.try_on_permission,
      },
    };
  }

  /**
   * Google OAuth authentication: verify token, create/find user, and issue tokens
   */
  async googleAuth(dto: GoogleAuthDto, res: Response) {
    // Verify the access token by fetching user info from Google
    let payload: {
      email?: string;
      name?: string;
      sub?: string;
    };

    try {
      // Use Google's userinfo endpoint to verify the access token
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${dto.token}`,
      );

      if (!response.ok) {
        throw new UnauthorizedException('Invalid Google token');
      }

      payload = await response.json();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to verify Google token');
    }

    if (!payload.email) {
      throw new BadRequestException('Email not found in Google token');
    }

    const email = payload.email;
    const name = payload.name || email.split('@')[0];

    // Admin login is intentionally disabled on Google auth.
    // Admins must use env-based secret verification endpoint instead.
    if (dto.role === 'ADMIN') {
      throw new UnauthorizedException(
        'Admin Google login is disabled. Use /auth/admin/verify-secret with ADMIN_EMAIL and ADMIN_SECRET.',
      );
    }

    // Check if user exists
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      // User exists - check if role matches
      if (user.role !== dto.role) {
        throw new UnauthorizedException('Invalid credentials - role mismatch');
      }
    } else {
      // Create new user with the specified role
      user = await this.prisma.user.create({
        data: {
          email,
          role: dto.role as UserRole,
          phone: dto.phoneNumber,
          status: 'active',
        },
      });

      // If creator, create Creator profile
      if (dto.role === 'CREATOR') {
        const storeName = dto.store_name || `${name}'s Store`;
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
              googleAuth: true,
              googleName: name,
              timestamp: new Date().toISOString(),
            },
          },
        });
      }
    }

    // Issue tokens
    const tokens = await this.issueTokens(user.user_id, user.role);

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
      data: { refresh_token_hash, last_login: new Date() },
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
        try_on_permission: user.try_on_permission,
      },
    };
  }

  async requestTryOnPermission(user_id: string) {
    const user = await this.prisma.user.findUnique({ where: { user_id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { user_id },
      data: { try_on_permission: TryOnPermissionStatus.PENDING },
    });
  }

  async getPendingTryOnPermissions() {
    return this.prisma.user.findMany({
      where: { try_on_permission: TryOnPermissionStatus.PENDING },
      select: {
        user_id: true,
        email: true,
        try_on_permission: true,
        created_at: true,
      },
    });
  }

  async getApprovedTryOnPermissions() {
    return this.prisma.user.findMany({
      where: { try_on_permission: TryOnPermissionStatus.APPROVED },
      select: {
        user_id: true,
        email: true,
        try_on_permission: true,
        created_at: true,
      },
    });
  }

  async updateTryOnPermission(user_id: string, status: TryOnPermissionStatus) {
    const user = await this.prisma.user.findUnique({ where: { user_id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { user_id },
      data: { try_on_permission: status },
    });
  }

  // OTP Methods
  async sendOtp(phoneNumber: string) {
    return this.otpService.sendOTP(phoneNumber);
  }

  async verifyOtp(phoneNumber: string, otp: string) {
    return this.otpService.verifyOTP(phoneNumber, otp);
  }
}
