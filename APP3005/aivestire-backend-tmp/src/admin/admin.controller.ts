import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { ReviewProductDto } from './dto/review-product.dto';
import { ToggleFeatureDto } from './dto/toggle-feature.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { AdminJwtGuard } from '../auth/admin/guards/admin-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(AdminJwtGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /admin/stats
   * Get dashboard statistics
   */
  @Get('stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  /**
   * GET /admin/products/pending
   * Get all products pending approval
   */
  @Get('products/pending')
  async getPendingProducts() {
    return this.adminService.getPendingProducts();
  }

  /**
   * GET /admin/products/approved
   * Get all approved products (The Collection)
   */
  @Get('products/approved')
  async getApprovedProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('creator') creatorId?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.adminService.getApprovedProducts(
      pageNum,
      limitNum,
      search,
      creatorId,
    );
  }

  /**
   * PATCH /admin/products/:id/feature
   * Toggle product featured status
   */
  @Patch('products/:id/feature')
  async toggleFeature(
    @Param('id') productId: string,
    @Body() dto: ToggleFeatureDto,
  ) {
    return this.adminService.toggleProductFeature(productId, dto.is_featured);
  }

  /**
   * PATCH /admin/products/:id/stock
   * Update product inventory count
   */
  @Patch('products/:id/stock')
  async updateStock(
    @Param('id') productId: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.adminService.updateProductStock(productId, dto.inventory_count);
  }

  /**
   * DELETE /admin/products/:id
   * Remove product from collection (soft delete)
   */
  @Delete('products/:id')
  async deleteProduct(@Param('id') productId: string) {
    return this.adminService.deleteProduct(productId);
  }

  /**
   * PATCH /admin/products/:id/review
   * Approve or reject a product
   */
  @Patch('products/:id/review')
  async reviewProduct(
    @Param('id') productId: string,
    @Body() dto: ReviewProductDto,
    @CurrentUser('user_id') adminUserId: string,
  ) {
    return this.adminService.reviewProduct(productId, dto, adminUserId);
  }

  /**
   * POST /admin/upload-csv
   * Upload CSV file to import products
   */
  @Post('upload-csv')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCSV(@UploadedFile() file: Express.Multer.File) {
    return this.adminService.importProductsFromCSV(file);
  }
}
