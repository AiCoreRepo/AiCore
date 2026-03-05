import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BirthdayCouponsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findUserDateOfBirth(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { user_id: userId },
            select: { date_of_birth: true },
        });
        return user?.date_of_birth;
    }

    async updateUserDateOfBirth(userId: string, dateOfBirth: Date) {
        return this.prisma.user.update({
            where: { user_id: userId },
            data: { date_of_birth: dateOfBirth },
        });
    }

    async findActiveBirthdayCoupons() {
        return this.prisma.coupon.findMany({
            where: {
                is_deleted: false,
                status: 'ACTIVE',
                start_date: { lte: new Date() },
                end_date: { gte: new Date() },
                scope: {
                    scope_type: 'USER_BIRTHDAY',
                },
            },
            include: {
                scope: true,
            },
        });
    }

    async findActiveCompanyAnniversaryCoupons() {
        return this.prisma.coupon.findMany({
            where: {
                is_deleted: false,
                status: 'ACTIVE',
                start_date: { lte: new Date() },
                end_date: { gte: new Date() },
                scope: {
                    scope_type: 'COMPANY_ANNIVERSARY',
                },
            },
            include: {
                scope: true,
            },
        });
    }
}
