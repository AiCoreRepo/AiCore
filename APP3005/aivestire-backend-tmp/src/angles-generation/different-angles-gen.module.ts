import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryService } from '../common/cloudinary.service';
import { ImageOptimizerService } from '../common/image-optimizer.service';
import { AngleGenerationController } from './controllers/angle-generation.controller';
import { AngleGenerationService } from './services/angle-generation.service';
import { AngleSessionManagerService } from './services/angle-session-manager.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AngleGenerationController],
  providers: [
    AngleGenerationService,
    AngleSessionManagerService,
    CloudinaryService,
    ImageOptimizerService,
  ],
  exports: [AngleGenerationService, AngleSessionManagerService],
})
export class DifferentAnglesGenModule {}
