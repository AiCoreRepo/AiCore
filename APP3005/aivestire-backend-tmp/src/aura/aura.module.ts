import { Module, OnModuleInit } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AuraController } from './controllers/aura.controller';
import { AuraService } from './services/aura.service';
import { AuraQueueService } from '../queues/aura-queue.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryService } from '../common/cloudinary.service';
import { GeminiAIService } from '../common/gemini-ai.service';
import { ImageOptimizerService } from '../common/image-optimizer.service';
import { BodyAnalyzerModule } from '../body-analyzer/body-analyzer.module';
import { QUEUE_NAMES } from '../common/constants/queue.constants';

const baseProviders = [
  AuraService,
  AuraQueueService,
  CloudinaryService,
  GeminiAIService,
  ImageOptimizerService,
];

@Module({
  imports: [
    PrismaModule,
    BodyAnalyzerModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.AURA_GENERATION,
    }),
  ],
  controllers: [AuraController],
  providers: baseProviders,
  exports: [
    AuraService,
    CloudinaryService,
    GeminiAIService,
    ImageOptimizerService,
  ],
})
export class AuraModule implements OnModuleInit {
  onModuleInit() {
    console.log(
      '🚀 [AuraModule] Module initialized with queue:',
      QUEUE_NAMES.AURA_GENERATION,
    );
  }
}

