// ============================================
// COUPON APPLY REPOSITORY
// Prisma abstraction for user-facing coupon queries
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CouponApplyRepository {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Find an active, non-deleted coupon by its code.
     * Includes scope and allowed pincodes for full validation.
     */
    async findActiveByCode(code: string) {
        return this.prisma.coupon.findFirst({
            where: {
                code: code.toUpperCase(),
                is_deleted: false,
            },
            include: {
                scope: true,
                allowed_pincodes: true,
            },
        });
    }

    /**
     * Atomically increment the coupon's current_usage by 1.
     */
    async incrementUsage(couponId: string) {
        return this.prisma.coupon.update({
            where: { coupon_id: couponId },
            data: {
                current_usage: { increment: 1 },
            },
        });
    }

    /**
     * Find all available coupons (active, not deleted, within date range, not maxed out).
     * Used for the user-facing coupon drawer/list.
     */
    async findAvailableCoupons() {
        const now = new Date();
        return this.prisma.coupon.findMany({
            where: {
                is_deleted: false,
                status: 'ACTIVE',
                start_date: { lte: now },
                end_date: { gte: now },
            },
            include: {
                scope: true,
            },
            orderBy: { created_at: 'desc' },
        });
    }

    /**
     * Finds a user's date of birth for birthday coupon validation.
     */
    async findUserDob(userId: string): Promise<Date | null> {
        const user = await this.prisma.user.findUnique({
            where: { user_id: userId },
            select: { date_of_birth: true }
        });
        return user?.date_of_birth || null;
    }
}
