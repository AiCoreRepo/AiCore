import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { DirectGeminiTryOnService } from './services/providers/direct-gemini-tryon.service';
import { DirectVertexTryOnService } from './services/providers/direct-vertex-tryon.service';
import { TryOnController } from './controllers/tryon.controller';
import { ImageOptimizerService } from '../common/image-optimizer.service';
import { QUEUE_NAMES } from '../common/constants/queue.constants';
import { TryOnQueueService } from '../queues/tryon-queue.service';
import { BodyAnalyzerModule } from '../body-analyzer/body-analyzer.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TryOnHistoryService } from './services/tryon-history.service';

/**
 * AiTryOnModule
 * Provides all try-on services consumed by both the API controllers and the Worker.
 * NOTE: TryOnProcessor lives in src/worker/ — it is registered only by WorkerModule,
 * not here, to keep Worker and API concerns cleanly separated.
 */
@Module({
  imports: [
    ConfigModule,
    BodyAnalyzerModule,
    PrismaModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.TRY_ON_PROCESSING,
    }),
  ],
  controllers: [TryOnController],
  providers: [
    DirectGeminiTryOnService,
    DirectVertexTryOnService,
    ImageOptimizerService,
    TryOnQueueService,
    TryOnHistoryService,
  ],
  exports: [
    DirectGeminiTryOnService,
    DirectVertexTryOnService,
    ImageOptimizerService,
    TryOnQueueService,
  ],
})
export class AiTryOnModule {}

