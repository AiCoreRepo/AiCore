import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreatorCouponsRepository } from './creator-coupons.repository';
import { CreateCreatorCouponDto } from './dto/create-creator-coupon.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCreatorCouponDto } from './dto/update-creator-coupon.dto';

@Injectable()
export class CreatorCouponsService {
    constructor(
        private readonly repository: CreatorCouponsRepository,
        private readonly prisma: PrismaService,
    ) { }

    async getMyCoupons(userId: string) {
        // Find creator linked to user
        const creator = await this.prisma.creator.findUnique({
            where: { user_id: userId }
        });

        if (!creator) {
            throw new NotFoundException('Creator profile not found');
        }

        return this.repository.findByCreatorId(creator.creator_id);
    }

    async createCoupon(userId: string, dto: CreateCreatorCouponDto) {
        // Validate creator
        const creator = await this.prisma.creator.findUnique({
            where: { user_id: userId }
        });

        if (!creator) {
            throw new NotFoundException('Creator profile not found');
        }

        // Validate product ownership
        const product = await this.prisma.product.findUnique({
            where: { product_id: dto.productId }
        });

        if (!product || product.creator_id !== creator.creator_id) {
            throw new ForbiddenException('You can only create coupons for your own products');
        }

        // Cannot coupon a pending or deleted product
        if (product.status !== 'APPROVED' || product.is_deleted) {
            throw new BadRequestException('Coupons can only be created for approved, active products');
        }

        // Code uniqueness across whole system
        const codeExists = await this.repository.codeExists(dto.code);
        if (codeExists) {
            throw new ConflictException('Coupon code already exists');
        }

        // Date validation
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        if (startDate >= endDate) {
            throw new BadRequestException('Start date must be before end date');
        }

        return this.repository.create(creator.creator_id, dto);
    }

    async deleteCoupon(userId: string, couponId: string) {
        // Validate creator
        const creator = await this.prisma.creator.findUnique({
            where: { user_id: userId }
        });

        if (!creator) {
            throw new NotFoundException('Creator profile not found');
        }

        const coupon = await this.repository.findById(couponId);
        if (!coupon) {
            throw new NotFoundException('Coupon not found');
        }

        if (coupon.creator_id !== creator.creator_id) {
            throw new ForbiddenException('You do not have permission to delete this coupon');
        }

        // Optional: Maybe only allow deleting if it's pending?
        // Or if approved, marking as deleted stops users from using it.
        // We'll allow soft deletion anytime to let creators pull their coupons.

        await this.repository.markDeleted(couponId);
        return { message: 'Coupon deleted successfully' };
    }

    async updateCoupon(userId: string, couponId: string, dto: UpdateCreatorCouponDto) {
        // Validate creator
        const creator = await this.prisma.creator.findUnique({
            where: { user_id: userId }
        });

        if (!creator) {
            throw new NotFoundException('Creator profile not found');
        }

        const coupon = await this.repository.findById(couponId);
        if (!coupon) {
            throw new NotFoundException('Coupon not found');
        }

        if (coupon.creator_id !== creator.creator_id) {
            throw new ForbiddenException('You do not have permission to update this coupon');
        }

        // Only allow updating if status is PENDING or REJECTED
        if (coupon.approval_status !== 'PENDING' && coupon.approval_status !== 'REJECTED') {
            throw new BadRequestException('Only pending or rejected coupons can be updated');
        }

        if (dto.startDate && dto.endDate) {
            const startDate = new Date(dto.startDate);
            const endDate = new Date(dto.endDate);
            if (startDate >= endDate) {
                throw new BadRequestException('Start date must be before end date');
            }
        }

        // When a creator updates a coupon, it goes back to PENDING status
        return this.repository.update(couponId, {
            ...dto,
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        });
    }
}
