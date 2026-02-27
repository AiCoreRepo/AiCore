// ============================================
// CREATE COUPON DTO
// ============================================

import {
    IsString,
    IsNotEmpty,
    IsEnum,
    IsNumber,
    IsOptional,
    IsArray,
    IsDateString,
    Min,
    MaxLength,
    IsInt,
} from 'class-validator';
import { CouponType, CouponStatus } from '@prisma/client';

export class CreateCouponDto {
    @IsString()
    @IsNotEmpty({ message: 'Title is required' })
    @MaxLength(200)
    title: string;

    @IsString()
    @IsNotEmpty({ message: 'Coupon code is required' })
    @MaxLength(50)
    code: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    description?: string;

    @IsEnum(CouponType, { message: 'Discount type must be FLAT, PERCENTAGE, or DELIVERY' })
    discountType: CouponType;

    @IsNumber({}, { message: 'Discount value must be a number' })
    @Min(0, { message: 'Discount value cannot be negative' })
    discountValue: number;

    @IsNumber({}, { message: 'Min order amount must be a number' })
    @Min(0, { message: 'Min order amount cannot be negative' })
    minOrderAmount: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    allowedPincodes?: string[];

    @IsOptional()
    isLocationRestricted?: boolean;

    @IsString()
    @IsOptional()
    @MaxLength(2000)
    termsAndConditions?: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    reason?: string;

    @IsDateString({}, { message: 'Start date must be a valid date string' })
    startDate: string;

    @IsDateString({}, { message: 'End date must be a valid date string' })
    endDate: string;

    @IsInt({ message: 'Max usage must be an integer' })
    @Min(1, { message: 'Max usage must be at least 1' })
    maxUsage: number;

    @IsEnum(CouponStatus, { message: 'Status must be ACTIVE, DISABLED, or EXPIRED' })
    @IsOptional()
    status?: CouponStatus;
}
