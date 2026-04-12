import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuthModule } from '../auth/admin/admin-auth.module';
import { CloudinaryService } from '../common/cloudinary.service';
import { AdminClothUploadController } from './admin-cloth-upload.controller';
import { ClothCleanupService } from './cloth-cleanup.service';
import { AdminClothUploadService } from './cloth-upload.service';

@Module({
  imports: [PrismaModule, AdminAuthModule],
  controllers: [AdminClothUploadController],
  providers: [AdminClothUploadService, ClothCleanupService, CloudinaryService],
})
export class AdminClothUploadModule {}
