// ============================================
// PAYMENT MODULE
// ============================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './services/payment.service';
import { PayUGatewayService } from './services/payu-gateway.service';
import { PaymentRepository } from './payment.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [ConfigModule, PrismaModule, EventEmitterModule, OrderModule],
  controllers: [PaymentController],
  providers: [PaymentService, PayUGatewayService, PaymentRepository],
  exports: [PaymentService, PayUGatewayService, PaymentRepository],
})
export class PaymentModule {}
