// ============================================
// COUPON APPLY CONTROLLER
// User-facing endpoints for applying coupons
// ============================================

import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
    Delete,
} from '@nestjs/common';
import { CouponApplyService, CartProductItem } from './coupon-apply.service';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { CartService } from '../cart/cart.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('coupons')
export class CouponApplyController {
    constructor(
        private readonly couponApplyService: CouponApplyService,
        private readonly cartService: CartService,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * POST /coupons/apply
     * Apply a coupon code — fetches user's cart internally,
     * checks product price eligibility, calculates discount.
     * Requires authenticated user.
     */
    @Post('apply')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async applyCoupon(@Request() req, @Body() dto: ApplyCouponDto) {
        const userId = req.user.user_id;

        // Fetch full cart (includes product details for price & stock checks)
        const cart = await this.cartService.getCart(userId);

        if (cart.summary.item_count === 0) {
            return {
                valid: false,
                message: 'Your cart is empty. Add items before applying a coupon.',
                discountAmount: 0,
            };
        }

        // Transform cart items for product eligibility check
        const cartItems: CartProductItem[] = cart.items.map((item) => ({
            productId: item.product_id,
            title: item.product.title,
            priceCents: item.product.price_cents,
            quantity: item.quantity,
            inventoryCount: item.product.inventory_count,
        }));

        const result = await this.couponApplyService.applyCoupon(
            dto.code,
            cart.summary.subtotal_cents,
            cart.summary.shipping_cents,
            cartItems,
        );

        if (result.valid) {
            await this.prisma.cart.update({
                where: { user_id: userId },
                data: { applied_coupon_code: dto.code },
            });
        }

        return result;
    }

    /**
     * DELETE /coupons/remove
     * Remove applied coupon from the user's cart
     */
    @Delete('remove')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async removeCoupon(@Request() req) {
        const userId = req.user.user_id;

        await this.prisma.cart.update({
            where: { user_id: userId },
            data: { applied_coupon_code: null },
        });

        return { success: true, message: 'Coupon removed from cart' };
    }

    /**
     * POST /coupons/validate
     * Quick validate a coupon code without full cart context.
     * Requires authenticated user.
     */
    @Post('validate')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async validateCoupon(@Body() dto: ApplyCouponDto) {
        return this.couponApplyService.validateCoupon(dto.code);
    }

    /**
     * GET /coupons/available
     * List all available coupons for the coupon drawer.
     * Annotates each coupon with eligibility based on user's cart subtotal.
     */
    @Get('available')
    @UseGuards(JwtAuthGuard)
    async getAvailableCoupons(@Request() req) {
        const userId = req.user.user_id;
        const cart = await this.cartService.getCart(userId);
        return this.couponApplyService.getAvailableCoupons(cart.summary.subtotal_cents);
    }
}
