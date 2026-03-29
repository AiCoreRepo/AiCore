import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VALID_ANALYTICS_ORDER_STATUSES } from '../constants/analytics.constants';
import { Prisma } from '@prisma/client';

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregate universal totals across all creators.
   * Performance: Single DB Query filtering out only DELIVERED orders.
   */
  async aggregateGlobalMetrics() {
    return this.prisma.orderItem.aggregate({
      _sum: {
        selling_price: true,
        creator_price: true,
        commission: true,
        quantity: true,
      },
      where: {
        order: {
          current_status: { in: VALID_ANALYTICS_ORDER_STATUSES },
        },
      },
    });
  }

  /**
   * Aggregate totals grouped by creator_id
   * Performance: Single DB Query returning metrics for all creators.
   */
  async aggregateCreatorMetrics(creatorIds?: string[]) {
    return this.prisma.orderItem.groupBy({
      by: ['creator_id'],
      _sum: {
        selling_price: true,
        creator_price: true,
        commission: true,
        quantity: true,
      },
      where: {
        order: {
          current_status: { in: VALID_ANALYTICS_ORDER_STATUSES },
        },
        ...(creatorIds?.length ? { creator_id: { in: creatorIds } } : {}),
      },
    });
  }

  /**
   * Aggregate product-level breakdowns specifically for a given creator.
   * Performance: Single DB query grouping by product_id
   */
  async getCreatorProductBreakdown(creatorId: string) {
    const productsGrouped = await this.prisma.orderItem.groupBy({
      by: ['product_id'],
      _sum: {
        selling_price: true,
        creator_price: true,
        commission: true,
        quantity: true,
      },
      where: {
        creator_id: creatorId,
        order: {
          current_status: { in: VALID_ANALYTICS_ORDER_STATUSES },
        },
      },
    });
    
    // Fetch product names since we cannot groupBy relational fields
    const productIds = productsGrouped.map(p => p.product_id);
    const productInfos = await this.prisma.product.findMany({
      where: { product_id: { in: productIds } },
      select: { product_id: true, title: true },
    });

    const productMap = new Map(productInfos.map(p => [p.product_id, p.title]));

    return productsGrouped.map((pg) => ({
      ...pg,
      product_name: productMap.get(pg.product_id) || 'Unknown Product',
    }));
  }
}
