

/**
 * Order Validation Utilities
 * Helper functions for validating order data
 */

export class OrderValidations {
    /**
     * Validate product availability and inventory
     */
    static validateInventory(
        availableCount: number,
        requestedQuantity: number,
        productName: string,
    ): void {
        if (availableCount < requestedQuantity) {
            throw new Error(
                `Insufficient inventory for ${productName}. Available: ${availableCount}, Requested: ${requestedQuantity}`,
            );
        }
    }

    /**
     * Validate if products were found
     */
    static validateProductsFound(
        foundCount: number,
        requestedCount: number,
    ): void {
        if (foundCount !== requestedCount) {
            throw new Error(
                `One or more products not found or unavailable. Found: ${foundCount}, Requested: ${requestedCount}`,
            );
        }
    }

    /**
     * Validate minimum order amount
     */
    static validateMinimumOrder(
        orderTotal: number,
        minimumAmount: number = 100,
    ): void {
        if (orderTotal < minimumAmount) {
            throw new Error(
                `Order total must be at least ₹${minimumAmount}. Current total: ₹${orderTotal}`,
            );
        }
    }

    /**
     * Validate payment method for order total
     */
    static validatePaymentMethod(
        paymentMethod: string,
        orderTotal: number,
        codLimit: number = 50000,
    ): void {
        if (paymentMethod === 'COD' && orderTotal > codLimit) {
            throw new Error(
                `COD is not available for orders above ₹${codLimit}`,
            );
        }
    }
}
