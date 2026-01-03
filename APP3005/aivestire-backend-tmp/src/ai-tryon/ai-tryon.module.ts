import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { GeminiTryOnService } from './services/providers/gemini-tryon.service';
import { VertexTryOnService } from './services/providers/vertex-tryon.service';
import { ImageValidatorService } from './services/common/image-validator.service';
import { TryOn3DService } from './services/tryon-3d.service';
import { TryOnController } from './controllers/tryon.controller';
import { AuraGuard } from '../common/guards/aura.guard';
import { CloudinaryService } from '../common/cloudinary.service';

@Module({
    imports: [ConfigModule, PrismaModule],
    controllers: [TryOnController],
    providers: [
        GeminiTryOnService,
        VertexTryOnService,
        ImageValidatorService,
        TryOn3DService,
        AuraGuard,
        CloudinaryService,
    ],
    exports: [GeminiTryOnService, VertexTryOnService, TryOn3DService],
})
export class AiTryOnModule { }
