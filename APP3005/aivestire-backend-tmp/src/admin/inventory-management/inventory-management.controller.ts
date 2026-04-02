import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryManagementService } from './inventory-management.service';
import { AdminJwtGuard } from '../../auth/admin/guards/admin-jwt.guard';
import { GetInventoryQueryDto } from './dto/get-inventory-query.dto';
import { UpdateStockExtendedDto } from './dto/update-stock-extended.dto';
import { BulkUpdateStockDto } from './dto/bulk-update-stock.dto';

/**
 * Admin Inventory Management
 * Routes are under /admin/inventory
 *
 * Pattern follows Myntra-style stock management:
 *  - Stock labels: OUT_OF_STOCK | LOW | OK | HIGH
 *  - Configurable thresholds per request
 *  - Admin can override label manually
 *  - Bulk update in single transaction
 */
@Controller('admin/inventory')
@UseGuards(AdminJwtGuard)
export class InventoryManagementController {
  constructor(
    private readonly inventoryService: InventoryManagementService,
  ) {}

  /**
   * GET /admin/inventory
   *
   * Inventory dashboard — all approved products with stock labels,
   * summary counts per tier, and pagination.
   *
   * Query params:
   *  - stock_status: ALL | OUT_OF_STOCK | LOW | OK | HIGH
   *  - search: product title or creator store name
   *  - creator_id: filter by specific creator
   *  - category: filter by category
   *  - page, limit
   *  - low_threshold (default: 5)  — inventory ≤ this → LOW
   *  - high_threshold (default: 50) — inventory ≥ this → HIGH
   */
  @Get()
  async getInventoryDashboard(@Query() query: GetInventoryQueryDto) {
    return this.inventoryService.getInventoryDashboard(query);
  }

  /**
   * PATCH /admin/inventory/bulk-update
   *
   * Bulk update stock counts + optional label overrides for multiple products.
   * All updates run in a single DB transaction (atomic).
   *
   * Body: { items: [{ product_id, inventory_count, stock_label_override? }] }
   */
  @Patch('bulk-update')
  async bulkUpdateStock(@Body() dto: BulkUpdateStockDto) {
    return this.inventoryService.bulkUpdateStock(dto);
  }

  /**
   * PATCH /admin/inventory/:id/stock
   *
   * Update stock count and optional label override for a single product.
   * Pass stock_label_override: null to remove an override (revert to auto-computed).
   *
   * Body: { inventory_count: number, stock_label_override?: 'LOW' | 'OK' | 'HIGH' | null }
   */
  @Patch(':id/stock')
  async updateProductStock(
    @Param('id') productId: string,
    @Body() dto: UpdateStockExtendedDto,
  ) {
    return this.inventoryService.updateProductStock(productId, dto);
  }
}
