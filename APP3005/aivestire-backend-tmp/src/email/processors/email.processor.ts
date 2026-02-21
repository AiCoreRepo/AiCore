import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EMAIL_QUEUE } from '../constants/email.constants';
import { SendEmailDto } from '../dto/send-email.dto';
import { EmailUtils } from '../utils/email.utils';

@Processor(EMAIL_QUEUE)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.hostinger.com',
      port: this.configService.get<number>('SMTP_PORT') || 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  @Process('send-email')
  async handleSendEmail(job: Job<SendEmailDto>) {
    this.logger.log(`Processing email job for ${job.data.to}`);

    const { to, subject, template, context } = job.data;
    const html = EmailUtils.getHtmlForTemplate(template, context);
    const emailSubject =
      subject || EmailUtils.getSubjectForTemplate(template, context);

    try {
      await this.transporter.sendMail({
        from: `"Aivestire" <${this.configService.get<string>('SMTP_USER')}>`,
        to,
        subject: emailSubject,
        html,
      });
      this.logger.log(`Email successfully sent to ${to}`);
    } catch (error) {
      this.logger.error(`Error sending email to ${to}`, error.stack);
      throw error; // Throw error to trigger retry mechanism in Bull
    }
  }
}
