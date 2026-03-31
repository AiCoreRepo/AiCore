// ============================================
// COUPON SCOPE CONTROLLER (Admin Only)
// ============================================

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { CouponScopeService } from './coupon-scope.service';
import { CreateCouponScopeDto } from './dto/create-coupon-scope.dto';
import { UpdateCouponScopeDto } from './dto/update-coupon-scope.dto';
import { AdminJwtGuard } from '../auth/admin/guards/admin-jwt.guard';

@Controller('admin/coupon-scopes')
@UseGuards(AdminJwtGuard)
export class CouponScopeController {
    constructor(private readonly scopeService: CouponScopeService) { }

    /**
     * GET /admin/coupon-scopes/festivals
     * Returns hardcoded festival list for admin dropdown
     */
    @Get('festivals')
    getFestivals() {
        return this.scopeService.getFestivalList();
    }

    /**
     * GET /admin/coupon-scopes/:couponId
     * Get scope for a specific coupon
     */
    @Get(':couponId')
    async getScope(@Param('couponId') couponId: string) {
        return this.scopeService.getScopeByCouponId(couponId);
    }

    /**
     * POST /admin/coupon-scopes/:couponId
     * Create or update scope for a coupon
     */
    @Post(':couponId')
    @HttpCode(HttpStatus.CREATED)
    async upsertScope(
        @Param('couponId') couponId: string,
        @Body() dto: CreateCouponScopeDto,
    ) {
        return this.scopeService.upsertScope(couponId, dto);
    }

    /**
     * DELETE /admin/coupon-scopes/:couponId
     * Remove scope from a coupon
     */
    @Delete(':couponId')
    async deleteScope(@Param('couponId') couponId: string) {
        return this.scopeService.deleteScope(couponId);
    }
}
