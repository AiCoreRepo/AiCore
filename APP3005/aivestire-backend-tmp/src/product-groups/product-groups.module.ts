import { Module } from '@nestjs/common';
import { ProductGroupsService } from './product-groups.service';
import { ProductGroupsController } from './product-groups.controller';
import { ProductGroupsRepository } from './product-groups.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { CreatorsModule } from '../creators/creators.module';

@Module({
  imports: [PrismaModule, CreatorsModule],
  controllers: [ProductGroupsController],
  providers: [ProductGroupsService, ProductGroupsRepository],
  exports: [ProductGroupsService],
})
export class ProductGroupsModule {}
