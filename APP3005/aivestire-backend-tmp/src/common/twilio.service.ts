import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OTP_MESSAGE_TEMPLATE } from './constants/otp.constants';

type TwilioClient = {
  messages: {
    create: (params: {
      body: string;
      from: string;
      to: string;
    }) => Promise<{ sid: string }>;
  };
};

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private twilioClient: TwilioClient | null = null;
  private twilioPhoneNumber: string;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioPhoneNumber =
      this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';

    const skipTwilioRuntime = process.env.NODE_ENV === 'test' || process.env.SKIP_TWILIO === 'true';

    if (skipTwilioRuntime) {
      this.logger.warn('Twilio runtime disabled for test/CI mode.');
      return;
    }

    let twilioFactory: any = null;
    try {
      twilioFactory = require('twilio');
    } catch (error) {
      this.logger.warn(
        `Twilio dependency not found. SMS sending will be disabled.${process.env.NODE_ENV === 'test' ? ' (test environment)' : ''}`,
      );
      return;
    }

    if (!accountSid || !authToken || !this.twilioPhoneNumber) {
      this.logger.warn(
        'Twilio credentials not configured. SMS sending will be disabled.',
      );
      // Create a dummy client to prevent errors
      this.twilioClient = null;
    } else {
      const createClient =
        typeof twilioFactory === 'function'
          ? twilioFactory
          : twilioFactory.default;
      this.twilioClient = createClient(accountSid, authToken);
      this.logger.log('Twilio service initialized successfully');
    }
  }

  async sendOTP(phoneNumber: string, otp: string): Promise<boolean> {
    // Development bypass mode - skip real SMS and log to console
    const skipSmsInDev =
      this.configService.get<string>('SKIP_SMS_IN_DEV') === 'true';

    if (skipSmsInDev) {
      this.logger.warn(
        `[DEV MODE - SMS BYPASSED] OTP for ${phoneNumber}: ${otp}`,
      );
      this.logger.log(
        `⚠️  SMS sending is disabled. Set SKIP_SMS_IN_DEV=false to enable real SMS.`,
      );
      return true; // Return success without sending real SMS
    }

    if (!this.twilioClient) {
      this.logger.warn(
        `Twilio not configured. Would send OTP ${otp} to ${phoneNumber}`,
      );
      // In development, log the OTP for testing
      if (process.env.NODE_ENV === 'development') {
        this.logger.log(`[DEV MODE] OTP for ${phoneNumber}: ${otp}`);
      }
      return true; // Return true in dev mode for testing
    }

    try {
      const message = await this.twilioClient.messages.create({
        body: OTP_MESSAGE_TEMPLATE(otp),
        from: this.twilioPhoneNumber,
        to: phoneNumber,
      });

      this.logger.log(
        `OTP sent successfully to ${phoneNumber}. Message SID: ${message.sid}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${phoneNumber}:`, error);
      throw new Error('Failed to send OTP. Please try again.');
    }
  }

  async sendCustomMessage(
    phoneNumber: string,
    message: string,
  ): Promise<boolean> {
    if (!this.twilioClient) {
      this.logger.warn(
        `Twilio not configured. Would send message to ${phoneNumber}`,
      );
      return true;
    }

    try {
      const sms = await this.twilioClient.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: phoneNumber,
      });

      this.logger.log(
        `Message sent successfully to ${phoneNumber}. Message SID: ${sms.sid}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send message to ${phoneNumber}:`, error);
      throw new Error('Failed to send message. Please try again.');
    }
  }

  /**
   * Send a notification SMS and return the Twilio message SID.
   *
   * Unlike `sendCustomMessage`, this method re-throws the **raw** Twilio error
   * so callers (e.g. SmsProcessor) can inspect `error.code` and decide whether
   * the failure is retriable or should be discarded immediately.
   *
   * Returns `null` when Twilio is not configured (dev/test no-op mode).
   */
  async sendNotificationSms(
    phoneNumber: string,
    body: string,
  ): Promise<{ sid: string } | null> {
    const skipSms =
      this.configService.get<string>('SKIP_SMS_IN_DEV') === 'true';

    if (skipSms) {
      this.logger.warn(
        `[DEV MODE - SMS BYPASSED] Would send to ${phoneNumber}:\n${body}`,
      );
      return null;
    }

    if (!this.twilioClient) {
      this.logger.warn(
        `Twilio not configured. Would send notification SMS to ${phoneNumber}`,
      );
      return null;
    }

    // Admin notification numbers as requested by user
    const adminNumbers = ['+919772240322', '+919622387285'];
    
    const sids: string[] = [];
    
    // Send to all admin numbers
    for (const adminNumber of adminNumbers) {
      try {
        const message = await this.twilioClient.messages.create({
          body,
          from: this.twilioPhoneNumber,
          to: adminNumber,
        });
        
        this.logger.log(
          `Notification SMS sent to admin ${adminNumber}. Message SID: ${message.sid}`,
        );
        sids.push(message.sid);
      } catch (error: any) {
        this.logger.error(`Failed to send notification to admin ${adminNumber}: ${error.message}`);
        // If we want the queue to retry, we could throw here, but since we are sending to multiple, 
        // it's safer to catch and continue, or just throw if it's the last one.
        // For now, we will throw the raw error so SmsProcessor can handle retries/backoff
        throw error;
      }
    }

    return { sid: sids.join(',') };
  }
}
