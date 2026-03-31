import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CreatorCouponsService } from './creator-coupons.service';
import { CreateCreatorCouponDto } from './dto/create-creator-coupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateCreatorCouponDto } from './dto/update-creator-coupon.dto'

@Controller('creator-dashboard/coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CREATOR')
export class CreatorCouponsController {
    constructor(private readonly service: CreatorCouponsService) { }

    @Get()
    async getMyCoupons(@CurrentUser() user: { user_id: string }) {
        return this.service.getMyCoupons(user.user_id);
    }

    @Post()
    async createCoupon(
        @CurrentUser() user: { user_id: string },
        @Body() dto: CreateCreatorCouponDto
    ) {
        return this.service.createCoupon(user.user_id, dto);
    }

    @Delete(':id')
    async deleteCoupon(
        @CurrentUser() user: { user_id: string },
        @Param('id') couponId: string
    ) {
        return this.service.deleteCoupon(user.user_id, couponId);
    }

    @Patch(':id')
    async updateCoupon(
        @CurrentUser() user: { user_id: string },
        @Param('id') couponId: string,
        @Body() dto: UpdateCreatorCouponDto
    ) {
        return this.service.updateCoupon(user.user_id, couponId, dto);
    }
}
