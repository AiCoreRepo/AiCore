import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { DirectGeminiTryOnService } from './services/providers/direct-gemini-tryon.service';
import { DirectVertexTryOnService } from './services/providers/direct-vertex-tryon.service';
import { ImageValidatorService } from './services/common/image-validator.service';
import { BodyAnalyzerService } from './services/body-analyzer.service';
import { TryOn3DService } from './services/tryon-3d.service';
import { TryOnController } from './controllers/tryon.controller';
import { AuraGuard } from '../common/guards/aura.guard';
import { CloudinaryService } from '../common/cloudinary.service';
import { ImageOptimizerService } from '../common/image-optimizer.service';
import { QUEUE_NAMES } from '../common/constants/queue.constants';
import { TryOnQueueService } from './tryon-queue.service';
import { TryOnProcessor } from './tryon.processor';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.TRY_ON_PROCESSING,
    }),
  ],
  controllers: [TryOnController],
  providers: [
    DirectGeminiTryOnService,
    DirectVertexTryOnService,
    ImageValidatorService,
    BodyAnalyzerService,
    TryOn3DService,
    AuraGuard,
    CloudinaryService,
    ImageOptimizerService,
    TryOnQueueService,
    TryOnProcessor,
  ],
  exports: [
    DirectGeminiTryOnService,
    DirectVertexTryOnService,
    BodyAnalyzerService,
    TryOn3DService,
    ImageOptimizerService,
    TryOnQueueService,
  ],
})
export class AiTryOnModule {}
