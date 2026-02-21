import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ReturnController } from './return.controller';
import { ReturnService } from './return.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RefundModule } from '../refund/refund.module';

@Module({
  imports: [PrismaModule, EventEmitterModule, RefundModule],
  controllers: [ReturnController],
  providers: [ReturnService],
  exports: [ReturnService],
})
export class ReturnModule {}
