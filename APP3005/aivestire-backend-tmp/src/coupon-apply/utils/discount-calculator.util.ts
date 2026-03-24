// ============================================
// DISCOUNT CALCULATOR UTILITY
// Pure math functions for coupon discount calculations
// ============================================

export enum DiscountType {
    FLAT = 'FLAT',
    PERCENTAGE = 'PERCENTAGE',
    DELIVERY = 'DELIVERY',
}

export interface DiscountInput {
    discountType: DiscountType;
    discountValue: number;     // flat amount in cents, or percentage (0-100)
    subtotalCents: number;     // cart subtotal in cents
    shippingCents: number;     // current shipping in cents
}

export interface DiscountResult {
    discountCents: number;     // total discount in cents
    freeShipping: boolean;     // whether shipping is waived
    message: string;           // human-readable message
}

/**
 * Calculate flat discount (capped at subtotal — never go negative)
 */
export function calculateFlatDiscount(discountValueCents: number, subtotalCents: number): number {
    return Math.min(discountValueCents, subtotalCents);
}

/**
 * Calculate percentage discount
 */
export function calculatePercentageDiscount(percentage: number, subtotalCents: number): number {
    if (percentage <= 0 || percentage > 100) return 0;
    return Math.round((subtotalCents * percentage) / 100);
}

/**
 * Calculate delivery (free shipping) discount
 */
export function calculateDeliveryDiscount(shippingCents: number): number {
    return shippingCents;
}

/**
 * Main discount calculator — routes to the correct type
 */
export function calculateDiscount(input: DiscountInput): DiscountResult {
    const { discountType, discountValue, subtotalCents, shippingCents } = input;

    switch (discountType) {
        case DiscountType.FLAT: {
            const discountCents = calculateFlatDiscount(discountValue, subtotalCents);
            return {
                discountCents,
                freeShipping: false,
                message: `₹${(discountCents / 100).toLocaleString('en-IN')} off applied!`,
            };
        }

        case DiscountType.PERCENTAGE: {
            const discountCents = calculatePercentageDiscount(discountValue, subtotalCents);
            return {
                discountCents,
                freeShipping: false,
                message: `${discountValue}% off — you save ₹${(discountCents / 100).toLocaleString('en-IN')}!`,
            };
        }

        case DiscountType.DELIVERY: {
            const discountCents = calculateDeliveryDiscount(shippingCents);
            return {
                discountCents,
                freeShipping: true,
                message: discountCents > 0
                    ? `Free delivery — you save ₹${(discountCents / 100).toLocaleString('en-IN')}!`
                    : 'Free delivery applied! (shipping was already free)',
            };
        }

        default:
            return { discountCents: 0, freeShipping: false, message: 'Unknown discount type' };
    }
}

/**
 * Format cents to ₹ display string
 */
export function formatCentsToRupees(cents: number): string {
    return `₹${(cents / 100).toLocaleString('en-IN')}`;
}
