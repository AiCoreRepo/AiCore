import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PasswordResetRepository } from './password-reset.repository';
import { EmailService } from '../../email/services/email.service';
import { EmailTemplate } from '../../email/enums/email.enums';
import * as crypto from 'crypto';
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
  ) {}

  /**
   * Request a password reset — generates token, stores hash, sends email.
   * ALWAYS returns the same response regardless of whether the email exists
   * to prevent user enumeration attacks.
   */
  async requestPasswordReset(
    email: string,
    ip?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const genericResponse = {
      message:
        'If an account exists with this email, reset instructions have been sent.',
    };

    // 1. Find user (silently return if not found — no enumeration)
    const user = await this.repository.findUserByEmail(normalizedEmail);

    if (!user) {
      this.logger.log(
        `Password reset requested for non-existent email: ${normalizedEmail}`,
      );
      return genericResponse;
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
      // Still return generic response to prevent enumeration
      return genericResponse;
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
    return genericResponse;
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

    // 2. Find the token record via repository
    const tokenRecord = await this.repository.findByTokenHash(tokenHash);

    if (!tokenRecord) {
      throw new BadRequestException(
        'Invalid or expired reset link. Please request a new one.',
      );
    }

    // 3. Check if already used
    if (tokenRecord.used) {
      throw new BadRequestException(
        'This reset link has already been used. Please request a new one.',
      );
    }

    // 4. Check expiry
    if (new Date() > tokenRecord.expires_at) {
      await this.repository.markTokenUsed(tokenRecord.token_id);
      throw new BadRequestException(
        'This reset link has expired. Please request a new one.',
      );
    }

    // 5. Hash new password with bcrypt
    const bcryptMod = await getBcrypt();
    if (!isBcryptModule(bcryptMod)) {
      throw new Error('Failed to load bcrypt module');
    }
    const newPasswordHash: string = await bcryptMod.hash(newPassword, 10);

    // 6. Atomic: update password + invalidate tokens + clear sessions
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
