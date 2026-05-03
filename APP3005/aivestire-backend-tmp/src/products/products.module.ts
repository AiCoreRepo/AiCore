import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { BulkUploadService } from './bulk-upload.service';
import { CreatorUploadService } from './creator-upload.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryService } from '../common/cloudinary.service';
import { SmsQueueModule } from '../queues/sms-queue.module';

@Module({
  imports: [PrismaModule, SmsQueueModule],
  controllers: [ProductsController],
  providers: [ProductsService, BulkUploadService, CreatorUploadService, CloudinaryService],
  exports: [ProductsService, CreatorUploadService],
})
export class ProductsModule {}
