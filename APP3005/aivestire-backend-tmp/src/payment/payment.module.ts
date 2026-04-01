// ============================================
// PAYMENT MODULE
// ============================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './services/payment.service';
import { RazorpayGatewayService } from './services/razorpay-gateway.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [ConfigModule, PrismaModule, EventEmitterModule, OrderModule],
  controllers: [PaymentController],
  providers: [PaymentService, RazorpayGatewayService],
  exports: [PaymentService, RazorpayGatewayService],
})
export class PaymentModule {}
