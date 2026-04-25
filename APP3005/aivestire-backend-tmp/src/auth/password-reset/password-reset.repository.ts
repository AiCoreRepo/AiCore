import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PasswordResetRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find a user by email (case-insensitive).
   */
  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        user_id: true,
        email: true,
        status: true,
        role: true,
      },
    });
  }

  /**
   * Count recent reset requests for a user within a time window.
   */
  async countRecentRequests(
    userId: string,
    windowStart: Date,
  ): Promise<number> {
    return this.prisma.passwordResetToken.count({
      where: {
        user_id: userId,
        created_at: { gte: windowStart },
      },
    });
  }

  /**
   * Invalidate all unused tokens for a user (mark as used).
   */
  async invalidateAllTokens(userId: string): Promise<void> {
    await this.prisma.passwordResetToken.updateMany({
      where: { user_id: userId, used: false },
      data: { used: true },
    });
  }

  /**
   * Create a new password reset token record.
   */
  async createToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.passwordResetToken.create({
      data: {
        user_id: data.userId,
        token_hash: data.tokenHash,
        expires_at: data.expiresAt,
        ip_address: data.ipAddress,
        user_agent: data.userAgent?.substring(0, 500),
      },
    });
  }

  /**
   * Find a token record by its SHA-256 hash.
   */
  async findByTokenHash(tokenHash: string) {
    return this.prisma.passwordResetToken.findFirst({
      where: { token_hash: tokenHash },
    });
  }

  /**
   * Mark a single token as used.
   */
  async markTokenUsed(tokenId: string): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { token_id: tokenId },
      data: { used: true, used_at: new Date() },
    });
  }

  /**
   * Atomic: update password + invalidate all tokens + clear sessions.
   */
  async resetPasswordAndInvalidate(
    userId: string,
    newPasswordHash: string,
    tokenId: string,
  ): Promise<void> {
    await this.prisma.$transaction([
      // Update the user's password and clear refresh token (force re-login)
      this.prisma.user.update({
        where: { user_id: userId },
        data: {
          password_hash: newPasswordHash,
          refresh_token_hash: null,
        },
      }),
      // Mark the specific token as used
      this.prisma.passwordResetToken.update({
        where: { token_id: tokenId },
        data: { used: true, used_at: new Date() },
      }),
      // Invalidate all remaining tokens for this user
      this.prisma.passwordResetToken.updateMany({
        where: { user_id: userId, used: false },
        data: { used: true },
      }),
    ]);
  }

  /**
   * Delete expired and old used tokens for cleanup.
   */
  async deleteExpiredTokens(): Promise<number> {
    const result = await this.prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { expires_at: { lt: new Date() } },
          {
            used: true,
            used_at: {
              lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
    });
    return result.count;
  }
}
