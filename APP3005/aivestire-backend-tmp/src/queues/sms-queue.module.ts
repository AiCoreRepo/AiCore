import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueModule } from './queue.module';
import { SmsQueueService } from './sms-queue.service';
import { QUEUE_NAMES } from '../common/constants/queue.constants';

/**
 * SmsQueueModule
 * ─────────────────────────────────────────────────────────────────
 * Registers the 'sms-notifications' Bull queue and provides the
 * SmsQueueService producer.
 *
 * Import this module in any feature module that needs to enqueue
 * an SMS (e.g. OrderModule, ProductsModule).
 *
 * The SmsProcessor consumer is registered separately in WorkerModule
 * so it only runs inside the dedicated worker process.
 */
@Module({
  imports: [
    QueueModule, // provides BullModule.forRootAsync Redis config
    BullModule.registerQueue({
      name: QUEUE_NAMES.SMS_NOTIFICATIONS,
    }),
  ],
  providers: [SmsQueueService],
  exports: [SmsQueueService],
})
export class SmsQueueModule {}
