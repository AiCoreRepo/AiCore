import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VALID_ANALYTICS_ORDER_STATUSES } from '../constants/analytics.constants';
import { Prisma, PaymentStatus } from '@prisma/client';

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregate universal totals across all creators.
   * Business Rule: Count only when order is DELIVERED AND payment is COMPLETED.
   * This correctly handles both prepaid and COD orders.
   * - Prepaid: payment_status = COMPLETED after successful online payment
   * - COD: payment_status = COMPLETED is set automatically when admin marks order DELIVERED
   * - Replacement orders (order_number ends with '-R') are excluded to prevent double-counting.
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
          payment_status: PaymentStatus.COMPLETED,
          NOT: { order_number: { endsWith: '-R' } },
        },
      },
    });
  }

  /**
   * Aggregate totals grouped by creator_id
   * Business Rule: Count only when order is DELIVERED AND payment is COMPLETED.
   * Replacement orders excluded to prevent double-counting.
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
          payment_status: PaymentStatus.COMPLETED,
          NOT: { order_number: { endsWith: '-R' } },
        },
        ...(creatorIds?.length ? { creator_id: { in: creatorIds } } : {}),
      },
    });
  }

  /**
   * Aggregate product-level breakdowns specifically for a given creator.
   * Business Rule: Count only when order is DELIVERED AND payment is COMPLETED.
   * Replacement orders excluded to prevent double-counting.
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
          payment_status: PaymentStatus.COMPLETED,
          NOT: { order_number: { endsWith: '-R' } },
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
