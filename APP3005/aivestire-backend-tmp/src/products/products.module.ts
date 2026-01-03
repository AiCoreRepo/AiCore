import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryService } from '../common/cloudinary.service';

@Module({
  imports: [PrismaModule],
  providers: [ProductsService, CloudinaryService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule { }
