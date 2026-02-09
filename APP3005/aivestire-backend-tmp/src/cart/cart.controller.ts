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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponseDto, CartSummaryDto } from './dto/cart-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
    constructor(private readonly cartService: CartService) { }

    @Get()
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
    @ApiOperation({ summary: 'Clear entire cart' })
    @ApiResponse({
        status: 200,
        description: 'Cart cleared successfully',
    })
    async clearCart(@Request() req): Promise<{ message: string }> {
        return this.cartService.clearCart(req.user.user_id);
    }
}
