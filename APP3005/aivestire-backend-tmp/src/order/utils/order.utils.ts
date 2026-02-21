import { OrderStatus } from '@prisma/client';

/**
 * Order Utility Functions
 * General helper functions for order processing
 */

export class OrderUtils {
  /**
   * Generate a unique order number
   * Format: ORD-YYYY-XXXXXX (e.g., ORD-2026-000123)
   */
  static generateOrderNumber(existingCount: number = 0): string {
    const year = new Date().getFullYear();
    const orderSequence = (existingCount + 1).toString().padStart(6, '0');
    return `ORD-${year}-${orderSequence}`;
  }

  /**
   * Get status description for display
   */
  static getStatusDescription(status: OrderStatus): string {
    const descriptions: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'Order placed successfully',
      [OrderStatus.BOOKED]: 'Order confirmed and booked',
      [OrderStatus.DISPATCHED]: 'Order is being prepared for shipment',
      [OrderStatus.SHIPPED]: 'Order has been shipped',
      [OrderStatus.OUT_FOR_DELIVERY]: 'Order is out for delivery',
      [OrderStatus.DELIVERED]: 'Order has been delivered successfully',
      [OrderStatus.CANCELLED]: 'Order has been cancelled',
    };

    return descriptions[status] || 'Order status updated';
  }

  /**
   * Extract product IDs from order items
   */
  static extractProductIds(items: Array<{ productId: string }>): string[] {
    return items.map((item) => item.productId);
  }

  /**
   * Check if order can be modified based on status
   */
  static canModifyOrder(status: OrderStatus): boolean {
    const modifiableStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.BOOKED,
    ];
    return modifiableStatuses.includes(status);
  }

  /**
   * Check if order can be cancelled based on status
   */
  static canCancelOrder(status: OrderStatus): boolean {
    const cancellableStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.BOOKED,
      OrderStatus.DISPATCHED,
    ];
    return cancellableStatuses.includes(status);
  }

  /**
   * Check if order is in terminal state
   */
  static isTerminalState(status: OrderStatus): boolean {
    const terminalStatuses: OrderStatus[] = [
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ];
    return terminalStatuses.includes(status);
  }

  /**
   * Format order number for display
   */
  static formatOrderNumber(orderNumber: string): string {
    return orderNumber.toUpperCase();
  }

  /**
   * Parse order date for timeline
   */
  static formatOrderDate(date: Date | string): string {
    const orderDate = typeof date === 'string' ? new Date(date) : date;
    return orderDate.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Calculate estimated delivery date
   */
  static calculateEstimatedDelivery(
    orderDate: Date,
    deliveryDays: number = 5,
  ): Date {
    const estimatedDate = new Date(orderDate);
    estimatedDate.setDate(estimatedDate.getDate() + deliveryDays);
    return estimatedDate;
  }
}
