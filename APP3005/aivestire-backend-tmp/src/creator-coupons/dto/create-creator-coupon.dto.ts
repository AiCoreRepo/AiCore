// ============================================
// CREATE CREATOR COUPON DTO
// ============================================

import {
    IsString,
    IsNotEmpty,
    IsEnum,
    IsNumber,
    IsDateString,
    Min,
    MaxLength,
    IsInt,
    IsOptional,
} from 'class-validator';
import { CouponType } from '@prisma/client';

export class CreateCreatorCouponDto {
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

    @IsDateString({}, { message: 'Start date must be a valid date string' })
    startDate: string;

    @IsDateString({}, { message: 'End date must be a valid date string' })
    endDate: string;

    @IsInt({ message: 'Max usage must be an integer' })
    @Min(1, { message: 'Max usage must be at least 1' })
    maxUsage: number;

    // Which product to apply this to
    @IsString()
    @IsNotEmpty({ message: 'Product ID is required' })
    productId: string;
}
