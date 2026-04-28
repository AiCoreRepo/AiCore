import {
  Injectable,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PasswordResetRepository } from './password-reset.repository';
import { EmailService } from '../../email/services/email.service';
import { EmailTemplate } from '../../email/enums/email.enums';
import * as crypto from 'crypto';
import { AuthProvider } from '@prisma/client';
import {
  RESET_TOKEN_BYTES,
  RESET_TOKEN_EXPIRY_MINUTES,
  RESET_RATE_LIMIT_WINDOW_MINUTES,
  MAX_RESET_REQUESTS_PER_WINDOW,
} from './password-reset.constants';

// Dynamic import for bcrypt (matches existing pattern in auth.service.ts)
let bcryptPromise: Promise<typeof import('bcrypt')> | null = null;
function getBcrypt(): Promise<typeof import('bcrypt')> {
  if (!bcryptPromise) {
    bcryptPromise = import('bcrypt');
  }
  return bcryptPromise;
}

function isBcryptModule(mod: unknown): mod is typeof import('bcrypt') {
  return (
    typeof mod === 'object' && mod !== null && 'hash' in mod && 'compare' in mod
  );
}

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly repository: PasswordResetRepository,
    private readonly emailService: EmailService,
  ) { }

  /**
   * Request a password reset — generates token, stores hash, sends email.
   * Validates that the email is registered, belongs to the correct role,
   * and is an email/password account (not Google OAuth).
   */
  async requestPasswordReset(
    email: string,
    ip?: string,
    userAgent?: string,
    role?: 'BUYER' | 'CREATOR',
  ): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Verify the email is registered with us
    const user = await this.repository.findUserByEmail(normalizedEmail);

    if (!user) {
      this.logger.log(
        `Password reset requested for non-existent email: ${normalizedEmail}`,
      );
      throw new NotFoundException(
        'No account found with this email address. Please check the email or create a new account.',
      );
    }

    // 2. Role validation — ensure the email belongs to the account type from the login page
    if (role && user.role !== role) {
      const roleLabel = role === 'BUYER' ? 'customer' : 'creator';
      this.logger.log(
        `Role mismatch on password reset: ${normalizedEmail} is ${user.role}, expected ${role}`,
      );
      throw new NotFoundException(
        `No ${roleLabel} account found with this email. Please use the correct login page.`,
      );
    }

    // 3. Google-only accounts have no password — guide them to the right flow
    const isGoogleAccount =
      user.auth_provider === AuthProvider.GOOGLE ||
      (!user.auth_provider && !user.password_hash && !!user.google_id);
    if (isGoogleAccount) {
      this.logger.log(
        `Password reset skipped for Google-auth account: ${normalizedEmail}`,
      );
      throw new BadRequestException(
        'This account was created with Google. Please use "Sign in with Google" — no password is needed.',
      );
    }

    // 2. Rate limit: max N requests per window per user
    const windowStart = new Date(
      Date.now() - RESET_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    );

    const recentRequests = await this.repository.countRecentRequests(
      user.user_id,
      windowStart,
    );

    if (recentRequests >= MAX_RESET_REQUESTS_PER_WINDOW) {
      this.logger.warn(
        `Rate limit hit for password reset: ${normalizedEmail}`,
      );
      throw new HttpException(
        'Too many reset requests. Please wait a few minutes before trying again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 3. Invalidate all previous unused tokens for this user
    await this.repository.invalidateAllTokens(user.user_id);

    // 4. Generate raw token + SHA-256 hash
    const rawToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    // 5. Calculate expiry
    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000,
    );

    // 6. Store hashed token via repository
    await this.repository.createToken({
      userId: user.user_id,
      tokenHash,
      expiresAt,
      ipAddress: ip,
      userAgent,
    });

    // 7. Build reset link and queue email
    const isProd = process.env.NODE_ENV === 'production';
    const frontendUrl =
      process.env.FRONTEND_URL ||
      (isProd ? 'https://aivestire.com' : 'http://localhost:8080');

    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    await this.emailService.queueEmail({
      to: normalizedEmail,
      template: EmailTemplate.PASSWORD_RESET,
      context: {
        resetLink,
        expiryMinutes: RESET_TOKEN_EXPIRY_MINUTES,
        userName: normalizedEmail.split('@')[0],
      },
    });

    this.logger.log(`Password reset email queued for: ${normalizedEmail}`);
    return {
      message: 'Reset instructions have been sent to your email address.',
    };
  }

  /**
   * Reset the password using the raw token from the email link.
   * Verifies token hash, checks expiry, updates password, and invalidates sessions.
   */
  async resetPassword(
    rawToken: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // 1. Hash the incoming token to look it up
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    // 2. Find a valid (unused, non-expired) token record
    //    Repository already filters: used=false AND expires_at > now
    const tokenRecord = await this.repository.findByTokenHash(tokenHash);

    if (!tokenRecord) {
      // Could be: invalid token, already used, or expired
      throw new BadRequestException(
        'This reset link is invalid or has expired. Please request a new one.',
      );
    }

    // 3. Hash new password with bcrypt
    const bcryptMod = await getBcrypt();
    if (!isBcryptModule(bcryptMod)) {
      throw new Error('Failed to load bcrypt module');
    }
    const newPasswordHash: string = await bcryptMod.hash(newPassword, 10);

    // 4. Atomic: update password + invalidate tokens + clear sessions
    await this.repository.resetPasswordAndInvalidate(
      tokenRecord.user_id,
      newPasswordHash,
      tokenRecord.token_id,
    );

    this.logger.log(
      `Password successfully reset for user: ${tokenRecord.user_id}`,
    );

    return {
      message:
        'Password has been reset successfully. Please log in with your new password.',
    };
  }

  /**
   * Cleanup expired tokens — runs every hour via cron.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTokens(): Promise<void> {
    const deletedCount = await this.repository.deleteExpiredTokens();

    if (deletedCount > 0) {
      this.logger.log(
        `Cleaned up ${deletedCount} expired/used password reset tokens`,
      );
    }
  }
}
