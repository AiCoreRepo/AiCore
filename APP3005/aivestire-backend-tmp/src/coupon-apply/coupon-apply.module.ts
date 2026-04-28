// ============================================
// COUPON APPLY MODULE
// User-facing coupon application module
// ============================================

import { Module } from '@nestjs/common';
import { CouponApplyController } from './coupon-apply.controller';
import { CouponApplyService } from './coupon-apply.service';
import { CouponApplyRepository } from './coupon-apply.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { CartModule } from '../cart/cart.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [PrismaModule, CartModule, AuthModule],
    controllers: [CouponApplyController],
    providers: [CouponApplyService, CouponApplyRepository],
    exports: [CouponApplyService],
})
export class CouponApplyModule { }
