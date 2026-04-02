import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InventoryManagementController } from './inventory-management.controller';
import { InventoryManagementService } from './inventory-management.service';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryManagementController],
  providers: [InventoryManagementService],
  exports: [InventoryManagementService],
})
export class InventoryManagementModule {}
