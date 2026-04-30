import { Injectable, Logger } from '@nestjs/common';
import {
  Processor,
  Process,
  OnQueueFailed,
  OnQueueCompleted,
} from '@nestjs/bull';
import type { Job } from 'bull';
import { QUEUE_NAMES, JOB_NAMES } from '../common/constants/queue.constants';
import { TwilioService } from '../common/twilio.service';
import type { SmsJobData } from '../queues/sms-queue.service';
import { buildOrderConfirmationSms } from '../common/sms-templates/order.sms-template';
import { buildCreatorUploadSms } from '../common/sms-templates/creator.sms-template';
import {
  NON_RETRIABLE_TWILIO_CODES,
  E164_PHONE_REGEX,
} from './constants/sms.constants';

/**
 * SmsProcessor — Bull queue consumer for SMS notification jobs.
 *
 * Lives in src/worker/ and is registered only by WorkerModule.
 * Delegates all Twilio API calls to the shared TwilioService.
 *
 * Handles two job types:
 *  1. order-confirmation-sms  → buyer receives order confirmation
 *  2. creator-upload-sms      → creator receives upload acknowledgement
 *
 * Retry strategy (configured in SmsQueueService):
 *  - 3 attempts with exponential back-off: 5 s → 10 s → 20 s
 *  - Non-retriable Twilio errors are discarded immediately (no retry)
 */
@Injectable()
@Processor(QUEUE_NAMES.SMS_NOTIFICATIONS)
export class SmsProcessor {
  private readonly logger = new Logger(SmsProcessor.name);

  constructor(private readonly twilioService: TwilioService) {
    this.logger.log('✅ SmsProcessor initialized.');
  }

  // ─── Job handlers ────────────────────────────────────────────────────────────

  @Process(JOB_NAMES.ORDER_CONFIRMATION_SMS)
  async handleOrderConfirmationSms(job: Job<SmsJobData>): Promise<void> {
    if (job.data.type !== JOB_NAMES.ORDER_CONFIRMATION_SMS) return;

    const { payload } = job.data;

    this.logger.log(
      `📲 Processing order confirmation SMS — Order ${payload.orderNumber} → ${payload.to}`,
    );

    const body = buildOrderConfirmationSms(payload);
    await this.sendSms(payload.to, body, job);

    this.logger.log(
      `✅ Order confirmation SMS dispatched — Order ${payload.orderNumber}`,
    );
  }

  @Process(JOB_NAMES.CREATOR_UPLOAD_SMS)
  async handleCreatorUploadSms(job: Job<SmsJobData>): Promise<void> {
    if (job.data.type !== JOB_NAMES.CREATOR_UPLOAD_SMS) return;

    const { payload } = job.data;

    this.logger.log(
      `📲 Processing creator upload SMS — "${payload.productTitle}" → ${payload.to}`,
    );

    const body = buildCreatorUploadSms(payload);
    await this.sendSms(payload.to, body, job);

    this.logger.log(
      `✅ Creator upload SMS dispatched — Product: ${payload.productTitle}`,
    );
  }

  // ─── Queue lifecycle hooks ───────────────────────────────────────────────────

  @OnQueueFailed()
  onFailed(job: Job<SmsJobData>, error: Error): void {
    const jobType = job.data?.type ?? 'unknown';
    this.logger.error(
      `❌ SMS job failed [${jobType}] | attempt ${job.attemptsMade}/${job.opts.attempts} | jobId: ${job.id}`,
      error.stack,
    );
  }

  @OnQueueCompleted()
  onCompleted(job: Job<SmsJobData>): void {
    const jobType = job.data?.type ?? 'unknown';
    this.logger.debug(`✔ SMS job completed [${jobType}] | jobId: ${job.id}`);
  }

  // ─── Core send logic ─────────────────────────────────────────────────────────

  /**
   * Delegates to TwilioService.sendNotificationSms().
   *
   * - Missing / invalid phone   → skip silently (no retry — unfixable)
   * - Non-retriable Twilio code → log + discard (no retry — unfixable)
   * - Retriable Twilio error    → rethrow so Bull schedules exponential back-off
   */
  private async sendSms(
    to: string,
    body: string,
    job: Job<SmsJobData>,
  ): Promise<void> {
    if (!to) {
      this.logger.warn(`Skipping SMS for job ${job.id} — missing phone`);
      return;
    }

    let normalizedTo = to.trim();
    if (!normalizedTo.startsWith('+')) {
      if (/^\d{10}$/.test(normalizedTo)) {
        normalizedTo = '+91' + normalizedTo;
      } else {
        normalizedTo = '+' + normalizedTo;
      }
    }

    // Guard: phone number must be present and in E.164 format
    if (!E164_PHONE_REGEX.test(normalizedTo)) {
      this.logger.warn(
        `Skipping SMS for job ${job.id} — invalid phone format: "${to}" (normalized: "${normalizedTo}")`,
      );
      return; // Not retriable — the number won't magically become valid
    }

    try {
      await this.twilioService.sendNotificationSms(normalizedTo, body);
    } catch (error: any) {
      const twilioCode: number | undefined = error?.code;

      if (twilioCode !== undefined && NON_RETRIABLE_TWILIO_CODES.has(twilioCode)) {
        // Permanent failure — discarding without retry saves quota and queue slots
        this.logger.warn(
          `Non-retriable Twilio error (code ${twilioCode}) for ${to} — discarding job ${job.id}: ${error.message}`,
        );
        return;
      }

      // Retriable error (429, 5xx, network timeout) — rethrow for Bull back-off
      throw error;
    }
  }
}
