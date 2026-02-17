import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ReplacementController } from './replace.controller';
import { ReplacementService } from './replace.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule, EventEmitterModule],
    controllers: [ReplacementController],
    providers: [ReplacementService],
    exports: [ReplacementService],
})
export class ReplacementModule { }
