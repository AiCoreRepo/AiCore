import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { EMAIL_QUEUE } from './constants/email.constants';
import { EmailService } from './services/email.service';
import { EmailProcessor } from './processors/email.processor';
import { OrderEmailListener } from './listeners/order.listener';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailController } from './controllers/email.controller';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    BullModule.registerQueue({
      name: EMAIL_QUEUE,
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailProcessor, OrderEmailListener],
  exports: [EmailService],
})
export class EmailModule { }
