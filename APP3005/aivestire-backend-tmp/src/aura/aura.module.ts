import { Module, OnModuleInit } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AuraController } from './aura.controller';
import { AuraService } from './aura.service';
import { AuraQueueService } from './aura-queue.service';
import { AuraProcessor } from './aura.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryService } from '../common/cloudinary.service';
import { GeminiAIService } from '../common/gemini-ai.service';
import { QUEUE_NAMES } from '../common/constants/queue.constants';

@Module({
    imports: [
        PrismaModule,
        BullModule.registerQueue({
            name: QUEUE_NAMES.AURA_GENERATION,
        }),
    ],
    controllers: [AuraController],
    providers: [
        AuraService,
        AuraQueueService,
        AuraProcessor,
        CloudinaryService,
        GeminiAIService,
    ],
    exports: [AuraService],
})
export class AuraModule implements OnModuleInit {
    onModuleInit() {
        console.log('🚀 [AuraModule] Module initialized with queue:', QUEUE_NAMES.AURA_GENERATION);
        console.log('🚀 [AuraModule] Processor should be registered now');
    }
}

