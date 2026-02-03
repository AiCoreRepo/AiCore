import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';
import { OTP_MESSAGE_TEMPLATE } from './constants/otp.constants';

@Injectable()
export class TwilioService {
    private readonly logger = new Logger(TwilioService.name);
    private twilioClient: twilio.Twilio;
    private twilioPhoneNumber: string;

    constructor(private configService: ConfigService) {
        const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
        this.twilioPhoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';

        if (!accountSid || !authToken || !this.twilioPhoneNumber) {
            this.logger.warn('Twilio credentials not configured. SMS sending will be disabled.');
            // Create a dummy client to prevent errors
            this.twilioClient = null as any;
        } else {
            this.twilioClient = twilio.default(accountSid, authToken);
            this.logger.log('Twilio service initialized successfully');
        }
    }

    async sendOTP(phoneNumber: string, otp: string): Promise<boolean> {
        // Development bypass mode - skip real SMS and log to console
        const skipSmsInDev = this.configService.get<string>('SKIP_SMS_IN_DEV') === 'true';

        if (skipSmsInDev) {
            this.logger.warn(`[DEV MODE - SMS BYPASSED] OTP for ${phoneNumber}: ${otp}`);
            this.logger.log(`⚠️  SMS sending is disabled. Set SKIP_SMS_IN_DEV=false to enable real SMS.`);
            return true; // Return success without sending real SMS
        }

        if (!this.twilioClient) {
            this.logger.warn(`Twilio not configured. Would send OTP ${otp} to ${phoneNumber}`);
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

            this.logger.log(`OTP sent successfully to ${phoneNumber}. Message SID: ${message.sid}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send OTP to ${phoneNumber}:`, error);
            throw new Error('Failed to send OTP. Please try again.');
        }
    }

    async sendCustomMessage(phoneNumber: string, message: string): Promise<boolean> {
        if (!this.twilioClient) {
            this.logger.warn(`Twilio not configured. Would send message to ${phoneNumber}`);
            return true;
        }

        try {
            const sms = await this.twilioClient.messages.create({
                body: message,
                from: this.twilioPhoneNumber,
                to: phoneNumber,
            });

            this.logger.log(`Message sent successfully to ${phoneNumber}. Message SID: ${sms.sid}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send message to ${phoneNumber}:`, error);
            throw new Error('Failed to send message. Please try again.');
        }
    }
}
