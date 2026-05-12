import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Job, Queue } from 'bull';
import { JOB_NAMES, QUEUE_NAMES } from '../common/constants/queue.constants';
import type {
  AdminOrderSmsPayload,
  OrderConfirmationSmsPayload,
} from '../common/sms-templates/order.sms-template';
import type { CreatorUploadSmsPayload } from '../common/sms-templates/creator.sms-template';

// ─── Job data shapes stored in Redis ──────────────────────────────────────────

export interface OrderConfirmationJobData {
  type: typeof JOB_NAMES.ORDER_CONFIRMATION_SMS;
  payload: OrderConfirmationSmsPayload;
}

export interface AdminOrderAlertJobData {
  type: typeof JOB_NAMES.ADMIN_ORDER_ALERT_SMS;
  payload: AdminOrderSmsPayload;
}

export interface CreatorUploadJobData {
  type: typeof JOB_NAMES.CREATOR_UPLOAD_SMS;
  payload: CreatorUploadSmsPayload;
}

export type SmsJobData =
  | OrderConfirmationJobData
  | AdminOrderAlertJobData
  | CreatorUploadJobData;

// ─── Default job options ───────────────────────────────────────────────────────

const SMS_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5_000, // 5s → 10s → 20s
  },
  timeout: 30_000, // 30 s hard kill
  removeOnComplete: 100, // keep last 100 completed jobs for observability
  removeOnFail: 200,     // keep last 200 failed jobs for debugging
} as const;

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class SmsQueueService {
  private readonly logger = new Logger(SmsQueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.SMS_NOTIFICATIONS)
    private readonly smsQueue: Queue<SmsJobData>,
  ) {}

  /**
   * Enqueue an order-confirmation SMS.
   * Called from OrderEventListener when an order is booked.
   */
  async enqueueOrderConfirmationSms(
    payload: OrderConfirmationSmsPayload,
  ): Promise<Job<SmsJobData>> {
    this.logger.log(
      `📨 Enqueuing order confirmation SMS for order ${payload.orderNumber} → ${payload.to}`,
    );

    return this.smsQueue.add(
      JOB_NAMES.ORDER_CONFIRMATION_SMS,
      { type: JOB_NAMES.ORDER_CONFIRMATION_SMS, payload } satisfies OrderConfirmationJobData,
      SMS_JOB_OPTIONS,
    );
  }

  async enqueueAdminOrderAlertSms(
    payload: AdminOrderSmsPayload,
  ): Promise<Job<SmsJobData>> {
    this.logger.log(
      `📨 Enqueuing admin order alert SMS for order ${payload.orderNumber} → ${payload.to}`,
    );

    return this.smsQueue.add(
      JOB_NAMES.ADMIN_ORDER_ALERT_SMS,
      { type: JOB_NAMES.ADMIN_ORDER_ALERT_SMS, payload } satisfies AdminOrderAlertJobData,
      SMS_JOB_OPTIONS,
    );
  }

  /**
   * Enqueue a creator upload notification SMS.
   * Called from CreatorUploadService after a product is saved.
   */
  async enqueueCreatorUploadSms(
    payload: CreatorUploadSmsPayload,
  ): Promise<Job<SmsJobData>> {
    this.logger.log(
      `📨 Enqueuing creator upload SMS for "${payload.productTitle}" → ${payload.to}`,
    );

    return this.smsQueue.add(
      JOB_NAMES.CREATOR_UPLOAD_SMS,
      { type: JOB_NAMES.CREATOR_UPLOAD_SMS, payload } satisfies CreatorUploadJobData,
      SMS_JOB_OPTIONS,
    );
  }
}
