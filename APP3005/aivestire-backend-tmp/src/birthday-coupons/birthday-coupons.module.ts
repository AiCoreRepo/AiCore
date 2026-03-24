import { Module } from '@nestjs/common';
import { BirthdayCouponsService } from './birthday-coupons.service';
import { BirthdayCouponsController } from './birthday-coupons.controller';
import { BirthdayCouponsRepository } from './birthday-coupons.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [BirthdayCouponsController],
    providers: [BirthdayCouponsService, BirthdayCouponsRepository],
    exports: [BirthdayCouponsService],
})
export class BirthdayCouponsModule { }
