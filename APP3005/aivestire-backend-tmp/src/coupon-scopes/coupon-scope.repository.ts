// ============================================
// COUPON SCOPE REPOSITORY (Prisma Abstraction)
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, CouponScopeType as PrismaScopeType } from '@prisma/client';

@Injectable()
export class CouponScopeRepository {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Create a scope for a coupon
     */
    async create(data: {
        couponId: string;
        scopeType: PrismaScopeType;
        minPrice?: number;
        maxPrice?: number;
        festivalKey?: string;
    }) {
        return this.prisma.couponScope.create({
            data: {
                coupon_id: data.couponId,
                scope_type: data.scopeType,
                min_price: data.minPrice !== undefined ? new Prisma.Decimal(data.minPrice) : null,
                max_price: data.maxPrice !== undefined ? new Prisma.Decimal(data.maxPrice) : null,
                festival_key: data.festivalKey || null,
            },
        });
    }

    /**
     * Find scope by coupon ID
     */
    async findByCouponId(couponId: string) {
        return this.prisma.couponScope.findUnique({
            where: { coupon_id: couponId },
        });
    }

    /**
     * Update scope by coupon ID
     */
    async updateByCouponId(couponId: string, data: {
        scopeType?: PrismaScopeType;
        minPrice?: number | null;
        maxPrice?: number | null;
        festivalKey?: string | null;
    }) {
        return this.prisma.couponScope.update({
            where: { coupon_id: couponId },
            data: {
                scope_type: data.scopeType,
                min_price: data.minPrice !== undefined
                    ? (data.minPrice !== null ? new Prisma.Decimal(data.minPrice) : null)
                    : undefined,
                max_price: data.maxPrice !== undefined
                    ? (data.maxPrice !== null ? new Prisma.Decimal(data.maxPrice) : null)
                    : undefined,
                festival_key: data.festivalKey !== undefined ? data.festivalKey : undefined,
            },
        });
    }

    /**
     * Upsert scope for a coupon (create or update)
     */
    async upsertByCouponId(couponId: string, data: {
        scopeType: PrismaScopeType;
        minPrice?: number;
        maxPrice?: number;
        festivalKey?: string;
    }) {
        return this.prisma.couponScope.upsert({
            where: { coupon_id: couponId },
            create: {
                coupon_id: couponId,
                scope_type: data.scopeType,
                min_price: data.minPrice !== undefined ? new Prisma.Decimal(data.minPrice) : null,
                max_price: data.maxPrice !== undefined ? new Prisma.Decimal(data.maxPrice) : null,
                festival_key: data.festivalKey || null,
            },
            update: {
                scope_type: data.scopeType,
                min_price: data.minPrice !== undefined ? new Prisma.Decimal(data.minPrice) : null,
                max_price: data.maxPrice !== undefined ? new Prisma.Decimal(data.maxPrice) : null,
                festival_key: data.festivalKey || null,
            },
        });
    }

    /**
     * Delete scope by coupon ID
     */
    async deleteByCouponId(couponId: string) {
        return this.prisma.couponScope.delete({
            where: { coupon_id: couponId },
        });
    }

    /**
     * Check if a scope exists for a coupon
     */
    async existsByCouponId(couponId: string): Promise<boolean> {
        const scope = await this.prisma.couponScope.findUnique({
            where: { coupon_id: couponId },
            select: { scope_id: true },
        });
        return !!scope;
    }
}
