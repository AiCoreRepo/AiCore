/**
 * Order Calculation Utilities
 * Helper functions for order-related calculations
 */

export class OrderCalculations {
    /**
     * Calculate total amount for order items
     */
    static calculateOrderTotal(
        items: Array<{ quantity: number; unitPrice: number }>,
    ): number {
        return items.reduce(
            (total, item) => total + item.quantity * item.unitPrice,
            0,
        );
    }

    /**
     * Calculate item total price
     */
    static calculateItemTotal(quantity: number, unitPrice: number): number {
        return quantity * unitPrice;
    }

    /**
     * Calculate discount amount
     */
    static calculateDiscount(
        totalAmount: number,
        discountPercentage: number,
    ): number {
        return (totalAmount * discountPercentage) / 100;
    }

    /**
     * Calculate final amount after discount
     */
    static calculateFinalAmount(
        totalAmount: number,
        discountAmount: number,
    ): number {
        return totalAmount - discountAmount;
    }

    /**
     * Calculate shipping cost based on order value
     */
    static calculateShippingCost(
        orderTotal: number,
        freeShippingThreshold: number = 500,
        shippingRate: number = 50,
    ): number {
        return orderTotal >= freeShippingThreshold ? 0 : shippingRate;
    }
}
