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
import { GetCreatorsQueryDto, ToggleCreatorStatusDto } from './dto/creator-management.dto';
import { UpdateAdminProductDto } from './dto/update-admin-product.dto';
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
   * GET /admin/products
   * Get all products with pagination and filters
   */
  @Get('products')
  async getAllProductsAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('creator') creatorId?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.adminService.getAllProductsAdmin(
      pageNum,
      limitNum,
      search,
      status,
      creatorId,
    );
  }

  /**
   * PATCH /admin/products/:id
   * Admin edit product (price, commission)
   */
  @Patch('products/:id')
  async updateProductAdmin(
    @Param('id') productId: string,
    @Body() dto: UpdateAdminProductDto,
  ) {
    return this.adminService.updateProductAdmin(productId, dto);
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

  // ─────────────────────────────────────────────────────────────────────────
  // CREATOR MANAGEMENT ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * GET /admin/creators
   * Get paginated list of all creators with search and status filter
   */
  @Get('creators')
  async getCreators(@Query() query: GetCreatorsQueryDto) {
    return this.adminService.getCreators(query);
  }

  /**
   * GET /admin/creators/:id
   * Get a single creator's full profile
   */
  @Get('creators/:id')
  async getCreatorById(@Param('id') creatorId: string) {
    return this.adminService.getCreatorById(creatorId);
  }

  /**
   * GET /admin/creators/:id/products
   * Get products uploaded by a specific creator
   */
  @Get('creators/:id/products')
  async getCreatorProducts(
    @Param('id') creatorId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.adminService.getCreatorProducts(creatorId, status, pageNum, limitNum);
  }

  /**
   * PATCH /admin/creators/:id/status
   * Activate or deactivate a creator account
   */
  @Patch('creators/:id/status')
  async toggleCreatorStatus(
    @Param('id') creatorId: string,
    @Body() dto: ToggleCreatorStatusDto,
  ) {
    return this.adminService.toggleCreatorStatus(creatorId, dto.action);
  }
}
