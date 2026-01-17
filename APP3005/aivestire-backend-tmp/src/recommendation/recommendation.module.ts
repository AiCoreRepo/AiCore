import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { AuraGuard } from '../common/guards/aura.guard';

@Module({
    imports: [
        HttpModule.register({
            timeout: 60000, // 60 seconds
            maxRedirects: 5,
        }),
        ConfigModule,
        PrismaModule,
    ],
    controllers: [RecommendationController],
    providers: [RecommendationService, AuraGuard],
    exports: [RecommendationService],
})
export class RecommendationModule { }
