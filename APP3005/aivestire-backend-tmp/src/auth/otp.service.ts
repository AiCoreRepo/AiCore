import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioService } from '../common/twilio.service';
import * as crypto from 'crypto';
import {
  OTP_LENGTH,
  OTP_EXPIRY_MINUTES,
  MAX_OTP_ATTEMPTS,
  OTP_RATE_LIMIT_WINDOW_MINUTES,
  MAX_OTP_REQUESTS_PER_WINDOW,
} from '../common/constants/otp.constants';

// Dynamic import for bcrypt
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
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private prisma: PrismaService,
    private twilioService: TwilioService,
  ) {}

  /**
   * Generate a random OTP of specified length
   */
  private generateOTP(): string {
    const digits = '0123456789';
    let otp = '';
    const randomBytes = crypto.randomBytes(OTP_LENGTH);

    for (let i = 0; i < OTP_LENGTH; i++) {
      otp += digits[randomBytes[i] % 10];
    }

    return otp;
  }

  /**
   * Check rate limiting for OTP requests
   */
  private async checkRateLimit(phoneNumber: string): Promise<void> {
    const windowStart = new Date(
      Date.now() - OTP_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    );

    const recentOtps = await this.prisma.otpVerification.count({
      where: {
        phone_number: phoneNumber,
        created_at: {
          gte: windowStart,
        },
      },
    });

    if (recentOtps >= MAX_OTP_REQUESTS_PER_WINDOW) {
      throw new BadRequestException(
        `Too many OTP requests. Please try again after ${OTP_RATE_LIMIT_WINDOW_MINUTES} minutes.`,
      );
    }
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(
    phoneNumber: string,
  ): Promise<{ success: boolean; expiresAt: Date }> {
    // Check rate limiting
    await this.checkRateLimit(phoneNumber);

    // Generate OTP
    const otp = this.generateOTP();
    this.logger.log(`Generated OTP for ${phoneNumber}`);

    // Hash OTP before storing
    const bcryptMod = await getBcrypt();
    if (!isBcryptModule(bcryptMod)) {
      throw new Error('Failed to load bcrypt module');
    }
    const otpHash = await bcryptMod.hash(otp, 10);

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate any existing OTPs for this phone number
    await this.prisma.otpVerification.updateMany({
      where: {
        phone_number: phoneNumber,
        verified: false,
      },
      data: {
        verified: true, // Mark as used/expired
      },
    });

    // Store hashed OTP
    await this.prisma.otpVerification.create({
      data: {
        phone_number: phoneNumber,
        otp_hash: otpHash,
        expires_at: expiresAt,
      },
    });

    // Send OTP via Twilio
    try {
      await this.twilioService.sendOTP(phoneNumber, otp);
      this.logger.log(`OTP sent successfully to ${phoneNumber}`);
      return { success: true, expiresAt };
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${phoneNumber}:`, error);
      throw new BadRequestException('Failed to send OTP. Please try again.');
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(
    phoneNumber: string,
    otp: string,
  ): Promise<{ success: boolean; token?: string }> {
    // Find the most recent unverified OTP for this phone number
    const otpRecord = await this.prisma.otpVerification.findFirst({
      where: {
        phone_number: phoneNumber,
        verified: false,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (!otpRecord) {
      throw new BadRequestException('No OTP found. Please request a new one.');
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expires_at) {
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      throw new BadRequestException(
        'Maximum verification attempts exceeded. Please request a new OTP.',
      );
    }

    // Verify OTP
    const bcryptMod = await getBcrypt();
    if (!isBcryptModule(bcryptMod)) {
      throw new Error('Failed to load bcrypt module');
    }

    const isValid = await bcryptMod.compare(otp, otpRecord.otp_hash);

    // Increment attempts
    await this.prisma.otpVerification.update({
      where: { otp_id: otpRecord.otp_id },
      data: { attempts: otpRecord.attempts + 1 },
    });

    if (!isValid) {
      const attemptsLeft = MAX_OTP_ATTEMPTS - (otpRecord.attempts + 1);
      throw new BadRequestException(
        `Invalid OTP. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`,
      );
    }

    // Mark OTP as verified
    await this.prisma.otpVerification.update({
      where: { otp_id: otpRecord.otp_id },
      data: { verified: true },
    });

    // Generate a verification token (valid for 10 minutes)
    const verificationToken = crypto.randomBytes(32).toString('hex');

    this.logger.log(`OTP verified successfully for ${phoneNumber}`);

    return {
      success: true,
      token: verificationToken,
    };
  }

  /**
   * Cleanup expired OTPs (should be run periodically)
   */
  async cleanupExpiredOTPs(): Promise<number> {
    const result = await this.prisma.otpVerification.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired OTPs`);
    return result.count;
  }

  /**
   * Verify phone number is verified
   */
  async isPhoneVerified(phoneNumber: string): Promise<boolean> {
    const verifiedOtp = await this.prisma.otpVerification.findFirst({
      where: {
        phone_number: phoneNumber,
        verified: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return !!verifiedOtp;
  }
}
