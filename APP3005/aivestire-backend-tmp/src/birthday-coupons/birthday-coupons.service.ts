import { Injectable, BadRequestException } from '@nestjs/common';
import { BirthdayCouponsRepository } from './birthday-coupons.repository';

@Injectable()
export class BirthdayCouponsService {
    constructor(private readonly repository: BirthdayCouponsRepository) { }

    async updateBirthday(userId: string, dateOfBirth: string) {
        const date = new Date(dateOfBirth);
        if (isNaN(date.getTime())) {
            throw new BadRequestException('Invalid date of birth');
        }

        await this.repository.updateUserDateOfBirth(userId, date);
        return { message: 'Date of birth updated successfully' };
    }

    async getSpecialCoupons(userId: string) {
        const dateOfBirth = await this.repository.findUserDateOfBirth(userId);
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentDate = today.getDate();

        let birthdayCoupons: any[] = [];
        let anniversaryCoupons: any[] = [];

        // 1. Check Birthday Coupons
        if (dateOfBirth) {
            const dobMonth = dateOfBirth.getMonth();
            const dobDate = dateOfBirth.getDate();

            if (currentMonth === dobMonth && currentDate === dobDate) {
                const activeBdayCoupons = await this.repository.findActiveBirthdayCoupons();
                birthdayCoupons = activeBdayCoupons.map(this.transformCoupon);
            }
        }

        // 2. Check Anniversary Coupons
        const activeAnnivCoupons = await this.repository.findActiveCompanyAnniversaryCoupons();

        // Filter anniversary coupons by their configured date matching today (month + date)
        const eligibleAnnivCoupons = activeAnnivCoupons.filter(c => {
            const annivDate = c.scope?.company_anniversary_date;
            if (!annivDate) return false;

            return annivDate.getMonth() === currentMonth && annivDate.getDate() === currentDate;
        });

        anniversaryCoupons = eligibleAnnivCoupons.map(this.transformCoupon);

        return {
            hasBirthday: !!dateOfBirth,
            isBirthdayToday: dateOfBirth ? (dateOfBirth.getMonth() === currentMonth && dateOfBirth.getDate() === currentDate) : false,
            birthdayCoupons,
            anniversaryCoupons,
        };
    }

    private transformCoupon(coupon: any) {
        let discountLabel = '';
        if (coupon.discount_type === 'DELIVERY') {
            discountLabel = 'Free Delivery';
        } else if (coupon.discount_type === 'PERCENTAGE') {
            discountLabel = `${Number(coupon.discount_value)}% off`;
        } else {
            discountLabel = `Flat ₹${Number(coupon.discount_value)} off`;
        }

        return {
            code: coupon.code,
            title: coupon.title,
            description: coupon.description,
            discountType: coupon.discount_type,
            discountValue: Number(coupon.discount_value),
            discountLabel,
            minOrderAmount: Number(coupon.min_order_amount),
            expiresAt: coupon.end_date.toISOString(),
        };
    }
}
