import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductStatus } from '@prisma/client';
import {
  GetInventoryQueryDto,
  StockStatusFilter,
} from './dto/get-inventory-query.dto';
import { UpdateStockExtendedDto } from './dto/update-stock-extended.dto';
import { BulkUpdateStockDto } from './dto/bulk-update-stock.dto';
import { DEFAULT_LOW_STOCK_THRESHOLD, DEFAULT_HIGH_STOCK_THRESHOLD } from './inventory.constants';

export type StockLabel = 'OUT_OF_STOCK' | 'LOW' | 'OK' | 'HIGH';

@Injectable()
export class InventoryManagementService {
  private readonly logger = new Logger(InventoryManagementService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Compute stock label for a product.
   * Admin override always takes priority over auto-computation.
   *
   * Label tiers (Myntra-style):
   *  OUT_OF_STOCK → inventory_count === 0
   *  LOW          → inventory_count <= lowThreshold  (default 5)
   *  OK           → everything in between
   *  HIGH         → inventory_count >= highThreshold  (default 50)
   */
  computeStockLabel(
    inventoryCount: number,
    override: string | null | undefined,
    lowThreshold = DEFAULT_LOW_STOCK_THRESHOLD,
    highThreshold = DEFAULT_HIGH_STOCK_THRESHOLD,
  ): StockLabel {
    if (override) return override as StockLabel;
    if (inventoryCount === 0) return 'OUT_OF_STOCK';
    if (inventoryCount <= lowThreshold) return 'LOW';
    if (inventoryCount >= highThreshold) return 'HIGH';
    return 'OK';
  }

  /**
   * Map StockStatusFilter to a Prisma inventory_count where clause.
   * Used when filtering by stock status via query param.
   */
  private buildStockFilter(
    status: StockStatusFilter | undefined,
    lowThreshold: number,
    highThreshold: number,
  ) {
    switch (status) {
      case StockStatusFilter.OUT_OF_STOCK:
        return { inventory_count: 0 };
      case StockStatusFilter.LOW:
        return {
          inventory_count: { gt: 0, lte: lowThreshold },
          stock_label_override: null,
        };
      case StockStatusFilter.HIGH:
        return {
          inventory_count: { gte: highThreshold },
          stock_label_override: null,
        };
      case StockStatusFilter.OK:
        return {
          inventory_count: { gt: lowThreshold, lt: highThreshold },
          stock_label_override: null,
        };
      default:
        return {};
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INVENTORY DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * GET /admin/inventory
   *
   * Returns a paginated inventory list with Myntra-style stock status labels:
   * - OUT_OF_STOCK, LOW, OK, HIGH
   * - Summary counts for each tier
   * - Supports filtering by tier, creator, search, category
   * - Supports custom thresholds per request
   */
  async getInventoryDashboard(query: GetInventoryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const lowThreshold = query.low_threshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
    const highThreshold = query.high_threshold ?? DEFAULT_HIGH_STOCK_THRESHOLD;
    const skip = (page - 1) * limit;

    // Base where — only non-deleted approved products
    const baseWhere: any = {
      is_deleted: false,
      status: ProductStatus.APPROVED,
    };

    if (query.creator_id) baseWhere.creator_id = query.creator_id;
    if (query.category) baseWhere.category = { contains: query.category, mode: 'insensitive' };
    if (query.search) {
      baseWhere.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { creator: { store_name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    // Stock status filter — applies additional where conditions
    const stockFilter = this.buildStockFilter(
      query.stock_status,
      lowThreshold,
      highThreshold,
    );

    const where = { ...baseWhere, ...stockFilter };

    // Parallel fetch: paginated products + summary counts
    const [products, total, outOfStockCount, lowStockCount, highStockCount] =
      await Promise.all([
        this.prisma.product.findMany({
          where,
          select: {
            product_id: true,
            title: true,
            category: true,
            inventory_count: true,
            stock_label_override: true,
            price_cents: true,
            currency: true,
            is_featured: true,
            updated_at: true,
            creator: {
              select: {
                creator_id: true,
                store_name: true,
              },
            },
            images: {
              where: { is_primary: true },
              take: 1,
              select: { url: true },
            },
          },
          orderBy: { inventory_count: 'desc' }, // highest stock first
          skip,
          take: limit,
        }),
        this.prisma.product.count({ where }),

        // Summary counts (always uses base filters, never stock filter)
        this.prisma.product.count({
          where: { ...baseWhere, inventory_count: 0 },
        }),
        this.prisma.product.count({
          where: {
            ...baseWhere,
            inventory_count: { gt: 0, lte: lowThreshold },
          },
        }),
        this.prisma.product.count({
          where: { ...baseWhere, inventory_count: { gte: highThreshold } },
        }),
      ]);

    const totalProducts = await this.prisma.product.count({ where: baseWhere });
    const okCount = totalProducts - outOfStockCount - lowStockCount - highStockCount;

    return {
      products: products.map((p) => ({
        product_id: p.product_id,
        title: p.title,
        category: p.category,
        thumbnail: p.images[0]?.url || null,
        inventory_count: p.inventory_count,
        stock_label: this.computeStockLabel(
          p.inventory_count,
          p.stock_label_override,
          lowThreshold,
          highThreshold,
        ),
        stock_label_override: p.stock_label_override,
        price_cents: p.price_cents,
        currency: p.currency,
        is_featured: p.is_featured,
        last_updated: p.updated_at,
        creator: p.creator,
      })),
      summary: {
        total: totalProducts,
        out_of_stock: outOfStockCount,
        low: lowStockCount,
        ok: okCount > 0 ? okCount : 0,
        high: highStockCount,
      },
      thresholds: {
        low_threshold: lowThreshold,
        high_threshold: highThreshold,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SINGLE PRODUCT STOCK UPDATE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * PATCH /admin/inventory/:id/stock
   *
   * Update stock count and optional label override for a single product.
   * Pass stock_label_override: null to remove an override (revert to auto).
   */
  async updateProductStock(productId: string, dto: UpdateStockExtendedDto) {
    const product = await this.prisma.product.findUnique({
      where: { product_id: productId },
      select: { product_id: true, title: true, inventory_count: true, stock_label_override: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const updated = await this.prisma.product.update({
      where: { product_id: productId },
      data: {
        inventory_count: dto.inventory_count,
        // Explicit null clears override; undefined leaves it unchanged
        ...(dto.stock_label_override !== undefined
          ? { stock_label_override: dto.stock_label_override ?? null }
          : {}),
        updated_at: new Date(),
      },
      select: {
        product_id: true,
        title: true,
        inventory_count: true,
        stock_label_override: true,
      },
    });

    const label = this.computeStockLabel(
      updated.inventory_count,
      updated.stock_label_override,
    );

    this.logger.log(
      `Stock updated: ${updated.title} → ${updated.inventory_count} [${label}]`,
    );

    return {
      message: 'Stock updated successfully',
      product_id: updated.product_id,
      title: updated.title,
      inventory_count: updated.inventory_count,
      stock_label: label,
      stock_label_override: updated.stock_label_override,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BULK STOCK UPDATE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * PATCH /admin/inventory/bulk-update
   *
   * Atomically update stock for multiple products in a single transaction.
   * Ideal for CSV-style mass stock corrections (like Myntra's bulk edit).
   */
  async bulkUpdateStock(dto: BulkUpdateStockDto) {
    const productIds = dto.items.map((i) => i.product_id);

    // Validate all products exist
    const existing = await this.prisma.product.findMany({
      where: { product_id: { in: productIds }, is_deleted: false },
      select: { product_id: true, title: true },
    });

    if (existing.length !== productIds.length) {
      const foundIds = new Set(existing.map((p) => p.product_id));
      const missing = productIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Products not found: ${missing.join(', ')}`,
      );
    }

    // Execute all updates in a single DB transaction
    const results = await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.product.update({
          where: { product_id: item.product_id },
          data: {
            inventory_count: item.inventory_count,
            ...(item.stock_label_override !== undefined
              ? { stock_label_override: item.stock_label_override ?? null }
              : {}),
            updated_at: new Date(),
          },
          select: {
            product_id: true,
            title: true,
            inventory_count: true,
            stock_label_override: true,
          },
        }),
      ),
    );

    this.logger.log(`Bulk stock update: ${results.length} products updated`);

    return {
      message: `${results.length} products updated successfully`,
      updated: results.map((p) => ({
        product_id: p.product_id,
        title: p.title,
        inventory_count: p.inventory_count,
        stock_label: this.computeStockLabel(
          p.inventory_count,
          p.stock_label_override,
        ),
        stock_label_override: p.stock_label_override,
      })),
    };
  }
}
