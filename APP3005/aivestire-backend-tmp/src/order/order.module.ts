import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrderController } from './order.controller';
import { OrderService } from './services/order.service';
import { OrderStateMachineService } from './services/order-state-machine.service';
import { OrderEventListener } from './listeners/order-event.listener';
import { PrismaModule } from '../prisma/prisma.module';
import { TrackingModule } from '../tracking/tracking.module';
import { SmsQueueModule } from '../queues/sms-queue.module';

@Module({
  imports: [PrismaModule, TrackingModule, EventEmitterModule.forRoot(), SmsQueueModule],
  controllers: [OrderController],
  providers: [OrderService, OrderStateMachineService, OrderEventListener],
  exports: [OrderService, OrderStateMachineService],
})
export class OrderModule {}
