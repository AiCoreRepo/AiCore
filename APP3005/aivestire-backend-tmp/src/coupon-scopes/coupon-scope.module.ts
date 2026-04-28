// ============================================
// COUPON SCOPE MODULE
// ============================================

import { Module } from '@nestjs/common';
import { CouponScopeController } from './coupon-scope.controller';
import { CouponScopeService } from './coupon-scope.service';
import { CouponScopeRepository } from './coupon-scope.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuthModule } from '../auth/admin/admin-auth.module';

@Module({
    imports: [PrismaModule, AdminAuthModule],
    controllers: [CouponScopeController],
    providers: [CouponScopeService, CouponScopeRepository],
    exports: [CouponScopeService],
})
export class CouponScopeModule { }
