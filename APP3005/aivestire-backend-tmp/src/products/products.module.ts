import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { BulkUploadService } from './bulk-upload.service';
import { CreatorUploadService } from './creator-upload.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryService } from '../common/cloudinary.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [ProductsService, BulkUploadService, CreatorUploadService, CloudinaryService],
  exports: [ProductsService, CreatorUploadService],
})
export class ProductsModule {}
