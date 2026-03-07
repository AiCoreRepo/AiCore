// ============================================
// COUPONS CONTROLLER (Admin Only)
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
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { AdminJwtGuard } from '../auth/admin/guards/admin-jwt.guard';

@Controller('admin/coupons')
@UseGuards(AdminJwtGuard)
export class CouponsController {
    constructor(private readonly couponsService: CouponsService) { }

    /**
     * GET /admin/coupons
     * Fetch all coupons (Admin only)
     */
    @Get()
    async getAllCoupons() {
        return this.couponsService.getAllCoupons();
    }

    /**
     * POST /admin/coupons
     * Create a new coupon (Admin only)
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createCoupon(@Body() dto: CreateCouponDto) {
        return this.couponsService.createCoupon(dto);
    }

    /**
     * PATCH /admin/coupons/:id
     * Update an existing coupon (Admin only)
     */
    @Patch(':id')
    async updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
        return this.couponsService.updateCoupon(id, dto);
    }

    /**
     * DELETE /admin/coupons/:id
     * Delete a coupon (Admin only)
     */
    @Delete(':id')
    async deleteCoupon(@Param('id') id: string) {
        return this.couponsService.deleteCoupon(id);
    }

    // ============================================
    // CREATOR COUPON APPROVALS
    // ============================================

    @Get('creator/pending')
    async getPendingCreatorCoupons() {
        return this.couponsService.getPendingCreatorCoupons();
    }

    @Patch('creator/:id/approve')
    async approveCreatorCoupon(@Param('id') id: string) {
        return this.couponsService.approveCreatorCoupon(id);
    }

    @Patch('creator/:id/reject')
    async rejectCreatorCoupon(
        @Param('id') id: string,
        @Body('reason') reason?: string
    ) {
        return this.couponsService.rejectCreatorCoupon(id, reason);
    }

    @Patch('creator/:id/archive')
    async archiveCreatorCoupon(@Param('id') id: string) {
        return this.couponsService.archiveCreatorCoupon(id);
    }
}
