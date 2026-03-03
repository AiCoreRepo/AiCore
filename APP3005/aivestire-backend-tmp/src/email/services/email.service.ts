import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { EMAIL_QUEUE } from '../constants/email.constants';
import { SendEmailDto } from '../dto/send-email.dto';
import { EmailUtils } from '../utils/email.utils';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(@InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue) {}

  async queueEmail(data: SendEmailDto) {
    if (!data.subject) {
      data.subject = EmailUtils.getSubjectForTemplate(
        data.template,
        data.context,
      );
    }

    try {
      await this.emailQueue.add('send-email', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
      });
      this.logger.log(
        `Email queued for ${data.to} with template ${data.template}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue email for ${data.to}: ${error.message}`,
      );
    }
  }
}
