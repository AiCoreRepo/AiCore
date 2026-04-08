import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryService } from '../common/cloudinary.service';
import { ImageOptimizerService } from '../common/image-optimizer.service';
import { AngleGenerationController } from './controllers/angle-generation.controller';
import { AngleGenerationService } from './services/angle-generation.service';
import { AngleSessionManagerService } from './services/angle-session-manager.service';
import { AngleQueueService } from '../queues/angle-queue.service';
import { QUEUE_NAMES } from '../common/constants/queue.constants';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.ANGLES_GENERATION,
    }),
  ],
  controllers: [AngleGenerationController],
  providers: [
    AngleGenerationService,
    AngleSessionManagerService,
    AngleQueueService,
    CloudinaryService,
    ImageOptimizerService,
  ],
  exports: [AngleGenerationService, AngleSessionManagerService, AngleQueueService],
})
export class DifferentAnglesGenModule {}
