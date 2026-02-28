// ============================================
// COUPONS MODULE
// ============================================

import { Module } from '@nestjs/common';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuthModule } from '../auth/admin/admin-auth.module';
import { CouponScopeModule } from '../coupon-scopes/coupon-scope.module';

@Module({
    imports: [PrismaModule, AdminAuthModule, CouponScopeModule],
    controllers: [CouponsController],
    providers: [CouponsService],
    exports: [CouponsService],
})
export class CouponsModule { }
