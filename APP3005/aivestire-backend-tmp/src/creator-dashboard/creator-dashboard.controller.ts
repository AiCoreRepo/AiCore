import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  Patch,
} from '@nestjs/common';
import { CreatorDashboardService } from './creator-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { VerifyUpiDto } from './dto/verify-upi.dto';
import { UpdateSizeStockDto } from './dto/update-size-stock.dto';

@Controller('creator-dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CREATOR')
export class CreatorDashboardController {
  constructor(
    private readonly creatorDashboardService: CreatorDashboardService,
  ) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: { user_id: string }) {
    return await this.creatorDashboardService.getCreatorProfile(user.user_id);
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser() user: { user_id: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return await this.creatorDashboardService.updateCreatorProfile(
      user.user_id,
      dto,
    );
  }

  @Post('payouts/verify-upi')
  async verifyPayoutUpi(
    @CurrentUser() user: { user_id: string },
    @Body() dto: VerifyUpiDto,
  ) {
    return await this.creatorDashboardService.verifyCreatorPayoutUpi(
      user.user_id,
      dto.upiId,
    );
  }

  @Get('metrics')
  async getDashboardMetrics(@CurrentUser() user: { user_id: string }) {
    return await this.creatorDashboardService.getCreatorDashboardMetrics(
      user.user_id,
    );
  }

  @Get('products')
  async getProducts(
    @CurrentUser() user: { user_id: string },
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('groupId') groupId?: string,
  ) {
    return await this.creatorDashboardService.getCreatorProducts(
      user.user_id,
      page,
      limit,
      groupId,
    );
  }

  @Post('products')
  async createProduct(
    @CurrentUser() user: { user_id: string },
    @Body() dto: CreateProductDto,
  ) {
    return await this.creatorDashboardService.createProduct(user.user_id, dto);
  }

  @Put('products/:id')
  async updateProduct(
    @CurrentUser() user: { user_id: string },
    @Param('id') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return await this.creatorDashboardService.updateProduct(
      user.user_id,
      productId,
      dto,
    );
  }

  @Delete('products/:id')
  async deleteProduct(
    @CurrentUser() user: { user_id: string },
    @Param('id') productId: string,
  ) {
    return await this.creatorDashboardService.deleteProduct(
      user.user_id,
      productId,
    );
  }

  @Patch('products/:id/publish')
  async publishProduct(
    @CurrentUser() user: { user_id: string },
    @Param('id') productId: string,
  ) {
    return await this.creatorDashboardService.publishProduct(
      user.user_id,
      productId,
    );
  }

  // ── Stock Management ─────────────────────────────────────────────────────

  /**
   * GET /creator-dashboard/stock-management
   * Returns all creator products with full Pattern → ColorVariant → SizeStock
   * hierarchy. Separate from the paginated /products endpoint.
   */
  @Get('stock-management')
  async getStockManagement(@CurrentUser() user: { user_id: string }) {
    return await this.creatorDashboardService.getCreatorStockManagement(
      user.user_id,
    );
  }

  /**
   * PATCH /creator-dashboard/stock-management/:variantId/sizes/:size
   * Update the stock for a single size within a colour variant.
   * Body: { stock: number } — must be a non-negative integer.
   */
  @Patch('stock-management/:variantId/sizes/:size')
  async updateSizeStock(
    @CurrentUser() user: { user_id: string },
    @Param('variantId') variantId: string,
    @Param('size') size: string,
    @Body() dto: UpdateSizeStockDto,
  ) {
    return await this.creatorDashboardService.updateVariantSizeStock(
      user.user_id,
      variantId,
      size,
      dto.stock,
    );
  }
}
