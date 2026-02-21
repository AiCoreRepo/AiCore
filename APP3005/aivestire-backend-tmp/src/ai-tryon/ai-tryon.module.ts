import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
// import { GeminiTryOnService } from './services/providers/gemini-tryon.service';
import { DirectVertexTryOnService } from './services/providers/direct-vertex-tryon.service';
import { ImageValidatorService } from './services/common/image-validator.service';
import { BodyAnalyzerService } from './services/body-analyzer.service';
import { TryOn3DService } from './services/tryon-3d.service';
import { TryOnController } from './controllers/tryon.controller';
import { AuraGuard } from '../common/guards/aura.guard';
import { CloudinaryService } from '../common/cloudinary.service';
import { ImageOptimizerService } from '../common/image-optimizer.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [TryOnController],
  providers: [
    // GeminiTryOnService,
    DirectVertexTryOnService,
    ImageValidatorService,
    BodyAnalyzerService,
    TryOn3DService,
    AuraGuard,
    CloudinaryService,
    ImageOptimizerService,
  ],
  exports: [
    // GeminiTryOnService,
    DirectVertexTryOnService,
    BodyAnalyzerService,
    TryOn3DService,
    ImageOptimizerService,
  ],
})
export class AiTryOnModule {}
