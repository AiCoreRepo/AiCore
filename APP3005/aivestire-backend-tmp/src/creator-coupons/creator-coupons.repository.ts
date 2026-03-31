import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCreatorCouponDto } from './dto/create-creator-coupon.dto';
import { CouponApprovalStatus } from '@prisma/client';

@Injectable()
export class CreatorCouponsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findByCreatorId(creatorId: string) {
        return this.prisma.creatorCoupon.findMany({
            where: {
                creator_id: creatorId,
                is_deleted: false,
            },
            include: {
                product: {
                    select: {
                        product_id: true,
                        title: true,
                        price_cents: true,
                        images: {
                            where: { is_primary: true },
                            take: 1,
                        }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async findById(couponId: string) {
        return this.prisma.creatorCoupon.findUnique({
            where: { creator_coupon_id: couponId }
        });
    }

    async create(creatorId: string, dto: CreateCreatorCouponDto) {
        return this.prisma.creatorCoupon.create({
            data: {
                creator_id: creatorId,
                product_id: dto.productId,
                title: dto.title,
                code: dto.code.trim().toUpperCase(),
                description: dto.description,
                discount_type: dto.discountType,
                discount_value: dto.discountValue,
                min_order_amount: dto.minOrderAmount,
                start_date: new Date(dto.startDate),
                end_date: new Date(dto.endDate),
                max_usage: dto.maxUsage,
                approval_status: CouponApprovalStatus.PENDING,
            }
        });
    }

    async markDeleted(couponId: string) {
        return this.prisma.creatorCoupon.update({
            where: { creator_coupon_id: couponId },
            data: { is_deleted: true }
        });
    }

    async update(couponId: string, data: any) {
        return this.prisma.creatorCoupon.update({
            where: { creator_coupon_id: couponId },
            data: {
                ...data,
                approval_status: CouponApprovalStatus.PENDING,
            }
        });
    }

    // Check if code exists globally in either Coupon or CreatorCoupon table
    async codeExists(code: string): Promise<boolean> {
        const normalizedCode = code.trim().toUpperCase();

        const existingGlobal = await this.prisma.coupon.findUnique({
            where: { code: normalizedCode }
        });

        if (existingGlobal) return true;

        const existingCreator = await this.prisma.creatorCoupon.findUnique({
            where: { code: normalizedCode }
        });

        return !!existingCreator;
    }
}
