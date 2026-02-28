// ============================================
// COUPONS SERVICE
// ============================================

import {
    Injectable,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { DiscountType, CouponStatus, MAX_PERCENTAGE_DISCOUNT, MIN_ORDER_AMOUNT, MAX_USAGE, MIN_USAGE } from './enums/discount-constants';
import getDynamicCouponStatus, { isCouponExpired } from './utils/discount-expiry-check';
import { Prisma } from '@prisma/client';
import { CouponScopeService } from '../coupon-scopes/coupon-scope.service';
import { CouponScopeType } from '../coupon-scopes/enums/scope-type.enum';

@Injectable()
export class CouponsService {
    private readonly logger = new Logger(CouponsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly scopeService: CouponScopeService,
    ) { }

    /**
     * GET all coupons (ordered by newest first)
     */
    async getAllCoupons() {
        const coupons = await this.prisma.coupon.findMany({
            where: { is_deleted: false },
            include: {
                allowed_pincodes: {
                    select: {
                        pincode: true,
                    },
                },
                scope: true,
            },
            orderBy: { created_at: 'desc' },
        });

        // Transform to frontend-friendly format
        return coupons.map((coupon) => ({
            id: coupon.coupon_id,
            title: coupon.title,
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discount_type,
            discountValue: Number(coupon.discount_value),
            minOrderAmount: Number(coupon.min_order_amount),
            isLocationRestricted: coupon.is_location_restricted,
            allowedPincodes: coupon.allowed_pincodes.map((p) => p.pincode),
            termsAndConditions: coupon.terms_and_conditions,
            reason: coupon.reason,
            startDate: coupon.start_date.toISOString(),
            endDate: coupon.end_date.toISOString(),
            maxUsage: coupon.max_usage,
            currentUsage: coupon.current_usage,
            status: getDynamicCouponStatus(coupon.status, coupon.end_date),
            isExpired: isCouponExpired(coupon.end_date),
            isOneTimePerUser: coupon.is_one_time_per_user,
            isStackable: coupon.is_stackable,
            scope: coupon.scope ? {
                scopeType: coupon.scope.scope_type,
                minPrice: coupon.scope.min_price ? Number(coupon.scope.min_price) : null,
                maxPrice: coupon.scope.max_price ? Number(coupon.scope.max_price) : null,
                festivalKey: coupon.scope.festival_key,
            } : null,
            createdAt: coupon.created_at.toISOString(),
            updatedAt: coupon.updated_at.toISOString(),
        }));
    }

    /**
     * CREATE a new coupon
     */
    async createCoupon(dto: CreateCouponDto) {
        // Normalize coupon code to uppercase
        const normalizedCode = dto.code.trim().toUpperCase();

        // Check for duplicate coupon code
        const existing = await this.prisma.coupon.findUnique({
            where: { code: normalizedCode },
        });

        if (existing) {
            throw new ConflictException(
                `Coupon code "${normalizedCode}" already exists`,
            );
        }

        // Validate end date is after start date
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);

        if (endDate <= startDate) {
            throw new BadRequestException(
                'End date must be after start date',
            );
        }

        // Validate percentage discount is <= 100
        if (dto.discountType === DiscountType.PERCENTAGE && dto.discountValue > MAX_PERCENTAGE_DISCOUNT) {
            throw new BadRequestException(
                'Percentage discount cannot exceed 100',
            );
        }

        // Create coupon with allowed pincodes in a transaction
        const coupon = await this.prisma.$transaction(async (tx) => {
            const newCoupon = await tx.coupon.create({
                data: {
                    title: dto.title.trim(),
                    code: normalizedCode,
                    description: dto.description?.trim() || null,
                    discount_type: dto.discountType,
                    discount_value: new Prisma.Decimal(dto.discountValue),
                    min_order_amount: new Prisma.Decimal(dto.minOrderAmount),
                    is_location_restricted: dto.isLocationRestricted || false,
                    max_usage: dto.maxUsage,
                    status: dto.status || 'ACTIVE',
                    reason: dto.reason?.trim() || null,
                    terms_and_conditions: dto.termsAndConditions?.trim() || null,
                    start_date: startDate,
                    end_date: endDate,
                },
            });

            // Insert allowed pincodes if provided and location is restricted
            if (dto.isLocationRestricted && dto.allowedPincodes && dto.allowedPincodes.length > 0) {
                const uniquePincodes = [...new Set(dto.allowedPincodes.map((p) => p.trim()).filter(Boolean))];

                if (uniquePincodes.length > 0) {
                    await tx.couponAllowedPincode.createMany({
                        data: uniquePincodes.map((pincode) => ({
                            coupon_id: newCoupon.coupon_id,
                            pincode,
                        })),
                    });
                }
            }

            // Return with pincodes included
            return tx.coupon.findUnique({
                where: { coupon_id: newCoupon.coupon_id },
                include: {
                    allowed_pincodes: {
                        select: { pincode: true },
                    },
                },
            });
        });

        if (!coupon) {
            throw new BadRequestException('Failed to create coupon');
        }

        this.logger.log(`Coupon created: ${normalizedCode} (${coupon.coupon_id})`);

        // Save scope if provided
        if (dto.scopeType && dto.scopeType !== CouponScopeType.GLOBAL) {
            await this.scopeService.upsertScope(coupon.coupon_id, {
                scopeType: dto.scopeType as any,
                minPrice: dto.scopeMinPrice,
                maxPrice: dto.scopeMaxPrice,
                festivalKey: dto.scopeFestivalKey,
            });
        }

        // Transform to frontend-friendly response
        return {
            id: coupon.coupon_id,
            title: coupon.title,
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discount_type,
            discountValue: Number(coupon.discount_value),
            minOrderAmount: Number(coupon.min_order_amount),
            isLocationRestricted: coupon.is_location_restricted,
            allowedPincodes: coupon.allowed_pincodes.map((p) => p.pincode),
            termsAndConditions: coupon.terms_and_conditions,
            reason: coupon.reason,
            startDate: coupon.start_date.toISOString(),
            endDate: coupon.end_date.toISOString(),
            maxUsage: coupon.max_usage,
            currentUsage: coupon.current_usage,
            status: coupon.status,
            createdAt: coupon.created_at.toISOString(),
            updatedAt: coupon.updated_at.toISOString(),
        };
    }
    /**
     * UPDATE a coupon
     */

    async updateCoupon(id: string, dto: UpdateCouponDto) {

        const existing = await this.prisma.coupon.findUnique({
            where: { coupon_id: id },
            include: { allowed_pincodes: true },
        });

        if (!existing) {
            throw new BadRequestException('Coupon not found');
        }

        // Validate percentage discount is <= 100
        if (dto.discountType === DiscountType.PERCENTAGE && Number(dto.discountValue) > MAX_PERCENTAGE_DISCOUNT) {
            throw new BadRequestException('Percentage discount cannot exceed 100');
        }

        if (dto.startDate && dto.endDate) {
            const startDate = new Date(dto.startDate);
            const endDate = new Date(dto.endDate);
            if (endDate <= startDate) {
                throw new BadRequestException('End date must be after start date');
            }
        }

        const coupon = await this.prisma.$transaction(async (tx) => {
            const updatedCoupon = await tx.coupon.update({
                where: { coupon_id: id },
                data: {
                    title: dto.title?.trim(),
                    code: dto.code?.trim().toUpperCase(),
                    description: dto.description?.trim(),
                    discount_type: dto.discountType,
                    discount_value: dto.discountValue !== undefined ? new Prisma.Decimal(dto.discountValue) : undefined,
                    min_order_amount: dto.minOrderAmount !== undefined ? new Prisma.Decimal(dto.minOrderAmount) : undefined,
                    is_location_restricted: dto.isLocationRestricted,
                    max_usage: dto.maxUsage,
                    status: dto.status,
                    reason: dto.reason?.trim(),
                    terms_and_conditions: dto.termsAndConditions?.trim(),
                    start_date: dto.startDate ? new Date(dto.startDate) : undefined,
                    end_date: dto.endDate ? new Date(dto.endDate) : undefined,
                },
            });

            // Handle Pincodes update
            if (dto.isLocationRestricted !== undefined || dto.allowedPincodes) {
                const isRestricted = dto.isLocationRestricted !== undefined ? dto.isLocationRestricted : existing.is_location_restricted;

                // Clear existing pincodes
                await tx.couponAllowedPincode.deleteMany({
                    where: { coupon_id: id },
                });

                // Add new pincodes if restricted
                if (isRestricted && dto.allowedPincodes && dto.allowedPincodes.length > 0) {
                    const uniquePincodes = [...new Set(dto.allowedPincodes.map((p: string) => p.trim()).filter(Boolean))];
                    if (uniquePincodes.length > 0) {
                        await tx.couponAllowedPincode.createMany({
                            data: uniquePincodes.map((pincode) => ({
                                coupon_id: id,
                                pincode: pincode as string,
                            })),
                        });
                    }
                }
            }

            return tx.coupon.findUnique({
                where: { coupon_id: id },
                include: { allowed_pincodes: { select: { pincode: true } } },
            });
        });

        if (!coupon) {
            throw new BadRequestException('Failed to update coupon');
        }

        this.logger.log(`Coupon updated: (${coupon.coupon_id})`);

        // Save/update scope if provided
        if (dto.scopeType) {
            if (dto.scopeType === CouponScopeType.GLOBAL) {
                // If switching to GLOBAL, delete existing scope
                try {
                    await this.scopeService.deleteScope(id);
                } catch { /* no scope to delete, ignore */ }
            } else {
                await this.scopeService.upsertScope(id, {
                    scopeType: dto.scopeType as any,
                    minPrice: dto.scopeMinPrice,
                    maxPrice: dto.scopeMaxPrice,
                    festivalKey: dto.scopeFestivalKey,
                });
            }
        }

        return {
            id: coupon.coupon_id,
            title: coupon.title,
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discount_type,
            discountValue: Number(coupon.discount_value),
            minOrderAmount: Number(coupon.min_order_amount),
            isLocationRestricted: coupon.is_location_restricted,
            allowedPincodes: coupon.allowed_pincodes.map((p) => p.pincode),
            termsAndConditions: coupon.terms_and_conditions,
            reason: coupon.reason,
            startDate: coupon.start_date.toISOString(),
            endDate: coupon.end_date.toISOString(),
            maxUsage: coupon.max_usage,
            currentUsage: coupon.current_usage,
            status: coupon.status,
            createdAt: coupon.created_at.toISOString(),
            updatedAt: coupon.updated_at.toISOString(),
        };
    }

    /**
     * DELETE a coupon
     */
    async deleteCoupon(id: string) {
        const existing = await this.prisma.coupon.findUnique({
            where: { coupon_id: id },
        });

        if (!existing) {
            throw new BadRequestException('Coupon not found');
        }

        // Soft delete
        await this.prisma.coupon.update({
            where: { coupon_id: id },
            data: { is_deleted: true },
        });

        this.logger.log(`Coupon soft-deleted: (${id})`);

        return { message: 'Coupon deleted successfully' };
    }
}