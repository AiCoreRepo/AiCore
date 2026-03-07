import { Module } from '@nestjs/common';
import { CreatorCouponsController } from './creator-coupons.controller';
import { CreatorCouponsService } from './creator-coupons.service';
import { CreatorCouponsRepository } from './creator-coupons.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [CreatorCouponsController],
    providers: [CreatorCouponsService, CreatorCouponsRepository],
    exports: [CreatorCouponsService, CreatorCouponsRepository],
})
export class CreatorCouponsModule { }
