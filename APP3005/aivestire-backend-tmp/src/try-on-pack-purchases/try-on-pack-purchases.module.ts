import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentModule } from '../payment/payment.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TryOnPackPurchasesController } from './try-on-pack-purchases.controller';
import { TryOnPackPurchasesRepository } from './try-on-pack-purchases.repository';
import { TryOnPackPurchasesService } from './try-on-pack-purchases.service';

@Module({
  imports: [ConfigModule, PrismaModule, PaymentModule],
  controllers: [TryOnPackPurchasesController],
  providers: [TryOnPackPurchasesRepository, TryOnPackPurchasesService],
  exports: [TryOnPackPurchasesService],
})
export class TryOnPackPurchasesModule {}
