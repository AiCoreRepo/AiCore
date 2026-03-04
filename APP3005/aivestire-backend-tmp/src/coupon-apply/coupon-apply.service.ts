// ============================================
// COUPON APPLY SERVICE
// User-facing coupon validation & discount calculation
// ============================================

import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { CouponApplyRepository } from './coupon-apply.repository';
import { CouponApplyResponseDto } from './dto/coupon-apply-response.dto';
import {
    calculateDiscount,
    DiscountType,
    formatCentsToRupees,
} from './utils/discount-calculator.util';

/**
 * Represents a product item from the cart for eligibility checks.
 */
export interface CartProductItem {
    productId: string;
    title: string;
    priceCents: number;       // individual product price in cents
    quantity: number;
    inventoryCount: number;   // available stock
}

/**
 * Result of product-level eligibility check.
 */
export interface ProductEligibilityResult {
    eligible: boolean;
    eligibleProducts: CartProductItem[];
    ineligibleProducts: { product: CartProductItem; reason: string }[];
    message: string;
}

@Injectable()
export class CouponApplyService {
    private readonly logger = new Logger(CouponApplyService.name);

    constructor(private readonly couponRepo: CouponApplyRepository) { }

    /**
     * Apply a coupon code to the user's cart.
     * Validates everything: existence, status, dates, usage, scope + product eligibility, location.
     * Returns the calculated discount.
     */
    async applyCoupon(
        code: string,
        subtotalCents: number,
        shippingCents: number,
        cartItems: CartProductItem[],
        userPincode?: string,
    ): Promise<CouponApplyResponseDto> {
        // 1. Find coupon
        const coupon = await this.couponRepo.findActiveByCode(code);

        if (!coupon) {
            throw new NotFoundException('Coupon not found. Please check the code and try again.');
        }

        // 2. Validate status
        if (coupon.status !== 'ACTIVE') {
            throw new BadRequestException(
                coupon.status === 'EXPIRED'
                    ? 'This coupon has expired.'
                    : 'This coupon is currently disabled.',
            );
        }

        // 3. Validate date range
        const now = new Date();
        if (now < new Date(coupon.start_date)) {
            throw new BadRequestException(
                `This coupon is not active yet. It starts on ${new Date(coupon.start_date).toLocaleDateString('en-IN')}.`,
            );
        }
        if (now > new Date(coupon.end_date)) {
            throw new BadRequestException('This coupon has expired.');
        }

        // 4. Validate usage limit
        if (coupon.current_usage >= coupon.max_usage) {
            throw new BadRequestException('This coupon has reached its maximum usage limit.');
        }

        // 5. Validate minimum order amount
        const minOrderCents = Number(coupon.min_order_amount) * 100;
        if (subtotalCents < minOrderCents) {
            throw new BadRequestException(
                `Minimum order amount of ${formatCentsToRupees(minOrderCents)} required. Your cart total is ${formatCentsToRupees(subtotalCents)}.`,
            );
        }

        // 6. Validate scope (cart-level)
        if (coupon.scope) {
            this.validateScope(coupon.scope, subtotalCents);
        }

        // 7. Check product-level eligibility (price range + stock)
        if (coupon.scope && coupon.scope.scope_type === 'PRICE_LEVEL') {
            const eligibility = this.checkProductEligibility(cartItems, coupon.scope);
            if (!eligibility.eligible) {
                throw new BadRequestException(eligibility.message);
            }
        }

        // 8. Validate location restriction
        if (coupon.is_location_restricted && coupon.allowed_pincodes.length > 0) {
            this.validateLocation(coupon.allowed_pincodes, userPincode);
        }

        // 9. Calculate discount
        const discountResult = calculateDiscount({
            discountType: coupon.discount_type as DiscountType,
            discountValue: coupon.discount_type === 'PERCENTAGE'
                ? Number(coupon.discount_value)
                : Number(coupon.discount_value) * 100,
            subtotalCents,
            shippingCents,
        });

        this.logger.log(
            `Coupon ${coupon.code} applied: type=${coupon.discount_type}, ` +
            `discount=${discountResult.discountCents} cents, subtotal=${subtotalCents} cents`,
        );

        // 10. Build response
        return {
            valid: true,
            couponId: coupon.coupon_id,
            code: coupon.code,
            title: coupon.title,
            discountType: coupon.discount_type,
            discountValue: Number(coupon.discount_value),
            discountAmount: discountResult.discountCents,
            freeShipping: discountResult.freeShipping,
            message: discountResult.message,
            scopeType: coupon.scope?.scope_type || undefined,
            scopeMinPrice: coupon.scope?.min_price ? Number(coupon.scope.min_price) : null,
            scopeMaxPrice: coupon.scope?.max_price ? Number(coupon.scope.max_price) : null,
            festivalKey: coupon.scope?.festival_key || null,
        };
    }

    /**
     * Check each product in the cart against the coupon's PRICE_LEVEL scope.
     * - Verifies product price falls within [minPrice, maxPrice] range
     * - Verifies product is in stock (inventory > 0)
     * - Returns detailed eligibility info per product
     */
    checkProductEligibility(
        cartItems: CartProductItem[],
        scope: { scope_type: string; min_price: any; max_price: any },
    ): ProductEligibilityResult {
        if (scope.scope_type !== 'PRICE_LEVEL') {
            // Non-price scopes: all products are eligible
            return {
                eligible: true,
                eligibleProducts: cartItems,
                ineligibleProducts: [],
                message: 'All products are eligible.',
            };
        }

        const minPriceCents = scope.min_price ? Number(scope.min_price) * 100 : 0;
        const maxPriceCents = scope.max_price ? Number(scope.max_price) * 100 : Infinity;

        const eligibleProducts: CartProductItem[] = [];
        const ineligibleProducts: { product: CartProductItem; reason: string }[] = [];

        for (const item of cartItems) {
            const reasons: string[] = [];

            // Check price range
            if (item.priceCents < minPriceCents) {
                reasons.push(
                    `Price ${formatCentsToRupees(item.priceCents)} is below minimum ${formatCentsToRupees(minPriceCents)}`,
                );
            }
            if (maxPriceCents !== Infinity && item.priceCents > maxPriceCents) {
                reasons.push(
                    `Price ${formatCentsToRupees(item.priceCents)} exceeds maximum ${formatCentsToRupees(maxPriceCents)}`,
                );
            }

            // Check stock availability
            if (item.inventoryCount <= 0) {
                reasons.push('Product is out of stock');
            }
            if (item.quantity > item.inventoryCount) {
                reasons.push(
                    `Requested qty ${item.quantity} exceeds available stock ${item.inventoryCount}`,
                );
            }

            if (reasons.length === 0) {
                eligibleProducts.push(item);
            } else {
                ineligibleProducts.push({ product: item, reason: reasons.join('; ') });
            }
        }

        // Decision: coupon is valid only if ALL products in cart are eligible
        if (ineligibleProducts.length > 0) {
            const firstBad = ineligibleProducts[0];
            const rangeStr = maxPriceCents === Infinity
                ? `above ${formatCentsToRupees(minPriceCents)}`
                : `between ${formatCentsToRupees(minPriceCents)} – ${formatCentsToRupees(maxPriceCents)}`;

            return {
                eligible: false,
                eligibleProducts,
                ineligibleProducts,
                message: ineligibleProducts.length === 1
                    ? `"${firstBad.product.title}" is not eligible: ${firstBad.reason}. This coupon is valid for products priced ${rangeStr}.`
                    : `${ineligibleProducts.length} product(s) in your cart are not eligible for this coupon. This coupon is valid for products priced ${rangeStr}.`,
            };
        }

        return {
            eligible: true,
            eligibleProducts,
            ineligibleProducts: [],
            message: 'All products in your cart are eligible for this coupon.',
        };
    }

    /**
     * Quick validate without full cart context (preview only)
     */
    async validateCoupon(code: string): Promise<{ valid: boolean; message: string; title?: string; discountType?: string; discountValue?: number }> {
        const coupon = await this.couponRepo.findActiveByCode(code);

        if (!coupon) {
            return { valid: false, message: 'Coupon not found.' };
        }

        if (coupon.status !== 'ACTIVE') {
            return { valid: false, message: `Coupon is ${coupon.status.toLowerCase()}.` };
        }

        const now = new Date();
        if (now < new Date(coupon.start_date) || now > new Date(coupon.end_date)) {
            return { valid: false, message: 'Coupon is not within its validity period.' };
        }

        if (coupon.current_usage >= coupon.max_usage) {
            return { valid: false, message: 'Coupon has reached its usage limit.' };
        }

        return {
            valid: true,
            message: 'Coupon is valid!',
            title: coupon.title,
            discountType: coupon.discount_type,
            discountValue: Number(coupon.discount_value),
        };
    }

    /**
     * Increment coupon usage after successful order placement.
     * Called from the order service after checkout completes.
     */
    async recordUsage(couponId: string): Promise<void> {
        await this.couponRepo.incrementUsage(couponId);
        this.logger.log(`Coupon ${couponId} usage incremented`);
    }

    /**
     * Get all available coupons for the coupon drawer.
     * Annotates each coupon with eligibility based on the user's cart subtotal.
     */
    async getAvailableCoupons(subtotalCents: number) {
        const coupons = await this.couponRepo.findAvailableCoupons();

        const result = coupons.map(coupon => {
            const minOrderCents = Number(coupon.min_order_amount) * 100;
            let isEligible = true;
            let ineligibleReason: string | undefined;

            // Check if coupon has reached usage limit
            const isFullyUsed = coupon.current_usage >= coupon.max_usage;
            if (isFullyUsed) {
                isEligible = false;
                ineligibleReason = 'This coupon has reached its usage limit';
            }

            // Check min order amount (only if not already fully used)
            if (isEligible && subtotalCents < minOrderCents) {
                isEligible = false;
                ineligibleReason = `Add ₹${((minOrderCents - subtotalCents) / 100).toLocaleString('en-IN')} more to use this coupon`;
            }

            // Check scope eligibility
            if (isEligible && coupon.scope) {
                if (coupon.scope.scope_type === 'PRICE_LEVEL') {
                    const scopeMin = coupon.scope.min_price ? Number(coupon.scope.min_price) * 100 : 0;
                    const scopeMax = coupon.scope.max_price ? Number(coupon.scope.max_price) * 100 : Infinity;
                    if (subtotalCents < scopeMin) {
                        isEligible = false;
                        ineligibleReason = `Valid for orders above ${formatCentsToRupees(scopeMin)}`;
                    } else if (scopeMax !== Infinity && subtotalCents > scopeMax) {
                        isEligible = false;
                        ineligibleReason = `Valid for orders up to ${formatCentsToRupees(scopeMax)}`;
                    }
                }
            }

            // Build scope label
            let scopeLabel: string | undefined;
            if (coupon.scope) {
                switch (coupon.scope.scope_type) {
                    case 'FESTIVAL':
                        scopeLabel = coupon.scope.festival_key
                            ? `🎉 ${coupon.scope.festival_key.charAt(0) + coupon.scope.festival_key.slice(1).toLowerCase()} Special`
                            : 'Festival Offer';
                        break;
                    case 'PRICE_LEVEL': {
                        const min = coupon.scope.min_price ? `₹${Number(coupon.scope.min_price)}` : '';
                        const max = coupon.scope.max_price ? `₹${Number(coupon.scope.max_price)}` : '';
                        scopeLabel = min && max ? `Orders ${min}–${max}` : min ? `Orders above ${min}` : max ? `Orders up to ${max}` : undefined;
                        break;
                    }
                }
            }

            // Build discount label
            let discountLabel: string;
            if (coupon.discount_type === 'DELIVERY') {
                discountLabel = 'Free Delivery';
            } else if (coupon.discount_type === 'PERCENTAGE') {
                discountLabel = `${Number(coupon.discount_value)}% off`;
            } else {
                discountLabel = `Flat ₹${Number(coupon.discount_value)} off`;
            }

            // Usage info
            const usageInfo = `${coupon.current_usage}/${coupon.max_usage} used`;

            return {
                code: coupon.code,
                title: coupon.title,
                description: coupon.description || '',
                discountType: coupon.discount_type,
                discountValue: Number(coupon.discount_value),
                discountLabel,
                minOrderAmount: Number(coupon.min_order_amount),
                scopeType: coupon.scope?.scope_type || 'GLOBAL',
                scopeLabel,
                isEligible,
                isFullyUsed,
                usageInfo,
                ineligibleReason,
                expiresAt: coupon.end_date.toISOString(),
            };
        });

        // Sort: eligible first, then partially used, then fully used
        result.sort((a, b) => {
            if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
            if (a.isFullyUsed !== b.isFullyUsed) return a.isFullyUsed ? 1 : -1;
            return b.discountValue - a.discountValue;
        });

        return result;
    }

    // ─── Private Validators ───────────────────────────

    /**
     * Validate coupon scope at cart level (overall subtotal check).
     */
    private validateScope(scope: any, subtotalCents: number): void {
        switch (scope.scope_type) {
            case 'PRICE_LEVEL': {
                const minPriceCents = scope.min_price ? Number(scope.min_price) * 100 : 0;
                const maxPriceCents = scope.max_price ? Number(scope.max_price) * 100 : Infinity;

                if (subtotalCents < minPriceCents) {
                    throw new BadRequestException(
                        `This coupon requires a minimum cart value of ${formatCentsToRupees(minPriceCents)}.`,
                    );
                }
                if (subtotalCents > maxPriceCents) {
                    throw new BadRequestException(
                        `This coupon is valid only for orders up to ${formatCentsToRupees(maxPriceCents)}.`,
                    );
                }
                break;
            }

            case 'FESTIVAL':
                // Festival scopes don't restrict by price — they're informational
                break;

            case 'GLOBAL':
                // No restrictions
                break;

            default:
                this.logger.warn(`Unknown scope type: ${scope.scope_type}`);
                break;
        }
    }

    private validateLocation(allowedPincodes: { pincode: string }[], userPincode?: string): void {
        if (!userPincode) {
            throw new BadRequestException(
                'This coupon is restricted to specific locations. Please provide your delivery pincode.',
            );
        }

        const allowed = allowedPincodes.map(p => p.pincode);
        if (!allowed.includes(userPincode)) {
            throw new BadRequestException(
                'This coupon is not available for your delivery location.',
            );
        }
    }
}
