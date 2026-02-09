import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { GuestCartService, GuestCartResponse } from './guest-cart.service';
import { CartMergeService } from './cart-merge.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponseDto, CartSummaryDto } from './dto/cart-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { getGuestSessionId } from '../common/middleware/guest-session.middleware';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
    constructor(
        private readonly cartService: CartService,
        private readonly guestCartService: GuestCartService,
        private readonly cartMergeService: CartMergeService,
    ) { }

    // ============================================
    // AUTHENTICATED USER CART ENDPOINTS
    // ============================================

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user cart' })
    @ApiResponse({
        status: 200,
        description: 'Cart retrieved successfully',
        type: CartResponseDto,
    })
    async getCart(@Request() req): Promise<CartResponseDto> {
        return this.cartService.getCart(req.user.user_id);
    }

    @Get('summary')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get cart summary (totals and counts)' })
    @ApiResponse({
        status: 200,
        description: 'Cart summary retrieved successfully',
        type: CartSummaryDto,
    })
    async getCartSummary(@Request() req): Promise<CartSummaryDto> {
        return this.cartService.getCartSummary(req.user.user_id);
    }

    @Post('items')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add item to cart' })
    @ApiResponse({
        status: 201,
        description: 'Item added to cart successfully',
        type: CartResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Product not found' })
    @ApiResponse({ status: 400, description: 'Invalid request or insufficient inventory' })
    async addToCart(
        @Request() req,
        @Body() dto: AddToCartDto,
    ): Promise<CartResponseDto> {
        return this.cartService.addToCart(req.user.user_id, dto);
    }

    @Patch('items/:cartItemId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update cart item quantity' })
    @ApiResponse({
        status: 200,
        description: 'Cart item updated successfully',
        type: CartResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Cart item not found' })
    @ApiResponse({ status: 400, description: 'Invalid quantity or insufficient inventory' })
    async updateCartItem(
        @Request() req,
        @Param('cartItemId') cartItemId: string,
        @Body() dto: UpdateCartItemDto,
    ): Promise<CartResponseDto> {
        return this.cartService.updateCartItem(req.user.user_id, cartItemId, dto);
    }

    @Delete('items/:cartItemId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Remove item from cart' })
    @ApiResponse({
        status: 200,
        description: 'Item removed from cart successfully',
        type: CartResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Cart item not found' })
    async removeFromCart(
        @Request() req,
        @Param('cartItemId') cartItemId: string,
    ): Promise<CartResponseDto> {
        return this.cartService.removeFromCart(req.user.user_id, cartItemId);
    }

    @Delete()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Clear entire cart' })
    @ApiResponse({
        status: 200,
        description: 'Cart cleared successfully',
    })
    async clearCart(@Request() req): Promise<{ message: string }> {
        return this.cartService.clearCart(req.user.user_id);
    }

    // ============================================
    // GUEST CART ENDPOINTS (NO AUTH REQUIRED)
    // ============================================

    @Get('guest')
    @ApiOperation({ summary: 'Get guest cart by session cookie' })
    @ApiResponse({
        status: 200,
        description: 'Guest cart retrieved successfully',
    })
    async getGuestCart(@Req() req): Promise<GuestCartResponse> {
        const sessionId = getGuestSessionId(req);
        if (!sessionId) {
            throw new Error('Guest session not found');
        }
        return this.guestCartService.getGuestCart(sessionId);
    }

    @Post('guest/items')
    @ApiOperation({ summary: 'Add item to guest cart' })
    @ApiResponse({
        status: 201,
        description: 'Item added to guest cart successfully',
    })
    @ApiResponse({ status: 404, description: 'Product not found' })
    @ApiResponse({ status: 400, description: 'Invalid request or insufficient inventory' })
    async addToGuestCart(
        @Req() req,
        @Body() dto: AddToCartDto,
    ): Promise<GuestCartResponse> {
        const sessionId = getGuestSessionId(req);
        if (!sessionId) {
            throw new Error('Guest session not found');
        }
        return this.guestCartService.addToGuestCart(sessionId, dto);
    }

    @Patch('guest/items/:cartItemId')
    @ApiOperation({ summary: 'Update guest cart item quantity' })
    @ApiResponse({
        status: 200,
        description: 'Guest cart item updated successfully',
    })
    @ApiResponse({ status: 404, description: 'Cart item not found' })
    async updateGuestCartItem(
        @Req() req,
        @Param('cartItemId') cartItemId: string,
        @Body() dto: UpdateCartItemDto,
    ): Promise<GuestCartResponse> {
        const sessionId = getGuestSessionId(req);
        if (!sessionId) {
            throw new Error('Guest session not found');
        }
        return this.guestCartService.updateGuestCartItem(sessionId, cartItemId, dto);
    }

    @Delete('guest/items/:cartItemId')
    @ApiOperation({ summary: 'Remove item from guest cart' })
    @ApiResponse({
        status: 200,
        description: 'Item removed from guest cart successfully',
    })
    @ApiResponse({ status: 404, description: 'Cart item not found' })
    async removeFromGuestCart(
        @Req() req,
        @Param('cartItemId') cartItemId: string,
    ): Promise<GuestCartResponse> {
        const sessionId = getGuestSessionId(req);
        if (!sessionId) {
            throw new Error('Guest session not found');
        }
        return this.guestCartService.removeFromGuestCart(sessionId, cartItemId);
    }

    @Delete('guest')
    @ApiOperation({ summary: 'Clear guest cart' })
    @ApiResponse({
        status: 200,
        description: 'Guest cart cleared successfully',
    })
    async clearGuestCart(@Req() req): Promise<{ message: string }> {
        const sessionId = getGuestSessionId(req);
        if (!sessionId) {
            throw new Error('Guest session not found');
        }
        return this.guestCartService.clearGuestCart(sessionId);
    }

    // ============================================
    // CART MERGE ENDPOINT (CALLED ON LOGIN)
    // ============================================

    @Post('merge')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Merge guest cart into user cart on login',
        description: 'Called after login to merge any guest cart items into the authenticated user cart. This is idempotent - calling multiple times produces the same result.',
    })
    @ApiResponse({
        status: 200,
        description: 'Cart merged successfully',
        type: CartResponseDto,
    })
    async mergeCart(@Request() req, @Req() rawReq) {
        const sessionId = getGuestSessionId(rawReq);
        if (!sessionId) {
            // No guest session, just return user cart
            return {
                cart: await this.cartService.getCart(req.user.user_id),
                mergeResult: {
                    merged_items: 0,
                    dropped_items: 0,
                    capped_items: 0,
                    price_updated_items: 0,
                    dropped_reasons: [],
                },
            };
        }
        return this.cartMergeService.mergeGuestCartToUser(req.user.user_id, sessionId);
    }
}
