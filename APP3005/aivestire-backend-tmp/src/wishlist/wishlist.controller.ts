import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import {
  WishlistResponseDto,
  WishlistSummaryDto,
  WishlistCheckResponseDto,
} from './dto/wishlist-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user wishlist' })
  @ApiResponse({
    status: 200,
    description: 'Wishlist retrieved successfully',
    type: WishlistResponseDto,
  })
  async getWishlist(@Request() req): Promise<WishlistResponseDto> {
    return this.wishlistService.getWishlist(req.user.user_id);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get wishlist summary (count and total value)' })
  @ApiResponse({
    status: 200,
    description: 'Wishlist summary retrieved successfully',
    type: WishlistSummaryDto,
  })
  async getWishlistSummary(@Request() req): Promise<WishlistSummaryDto> {
    return this.wishlistService.getWishlistSummary(req.user.user_id);
  }

  @Get('check/:productId')
  @ApiOperation({ summary: 'Check if product is in wishlist' })
  @ApiResponse({
    status: 200,
    description: 'Check result',
    type: WishlistCheckResponseDto,
  })
  async checkProductInWishlist(
    @Request() req,
    @Param('productId') productId: string,
  ): Promise<WishlistCheckResponseDto> {
    return this.wishlistService.isInWishlist(req.user.user_id, productId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to wishlist' })
  @ApiResponse({
    status: 201,
    description: 'Item added to wishlist successfully',
    type: WishlistResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Product already in wishlist' })
  async addToWishlist(
    @Request() req,
    @Body() dto: AddToWishlistDto,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.addToWishlist(req.user.user_id, dto);
  }

  @Post('toggle/:productId')
  @ApiOperation({ summary: 'Toggle product in wishlist (add/remove)' })
  @ApiResponse({
    status: 200,
    description: 'Wishlist toggled successfully',
  })
  async toggleWishlist(
    @Request() req,
    @Param('productId') productId: string,
  ): Promise<{ added: boolean; wishlist: WishlistResponseDto }> {
    return this.wishlistService.toggleWishlist(req.user.user_id, productId);
  }

  @Delete('items/:wishlistItemId')
  @ApiOperation({ summary: 'Remove item from wishlist' })
  @ApiResponse({
    status: 200,
    description: 'Item removed from wishlist successfully',
    type: WishlistResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Wishlist item not found' })
  async removeFromWishlist(
    @Request() req,
    @Param('wishlistItemId') wishlistItemId: string,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.removeFromWishlist(
      req.user.user_id,
      wishlistItemId,
    );
  }

  @Delete('product/:productId')
  @ApiOperation({ summary: 'Remove product from wishlist by product ID' })
  @ApiResponse({
    status: 200,
    description: 'Item removed from wishlist successfully',
    type: WishlistResponseDto,
  })
  async removeByProductId(
    @Request() req,
    @Param('productId') productId: string,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.removeByProductId(req.user.user_id, productId);
  }

  @Post('items/:wishlistItemId/move-to-cart')
  @ApiOperation({ summary: 'Move item from wishlist to cart' })
  @ApiResponse({
    status: 200,
    description: 'Item moved to cart successfully',
  })
  @ApiResponse({ status: 404, description: 'Wishlist item not found' })
  @ApiResponse({ status: 400, description: 'Product out of stock' })
  async moveToCart(
    @Request() req,
    @Param('wishlistItemId') wishlistItemId: string,
  ): Promise<{ message: string }> {
    return this.wishlistService.moveToCart(req.user.user_id, wishlistItemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear entire wishlist' })
  @ApiResponse({
    status: 200,
    description: 'Wishlist cleared successfully',
  })
  async clearWishlist(@Request() req): Promise<{ message: string }> {
    return this.wishlistService.clearWishlist(req.user.user_id);
  }
}
