import { Module } from '@nestjs/common';
import { CreatorDashboardService } from './creator-dashboard.service';
import { CreatorDashboardController } from './creator-dashboard.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryService } from '../common/cloudinary.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [CreatorDashboardService, CloudinaryService],
  controllers: [CreatorDashboardController],
  exports: [CreatorDashboardService],
})
export class CreatorDashboardModule {}
