import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RefundController } from './refund.controller';
import { RefundService } from './refund.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule, EventEmitterModule],
    controllers: [RefundController],
    providers: [RefundService],
    exports: [RefundService],
})
export class RefundModule { }
