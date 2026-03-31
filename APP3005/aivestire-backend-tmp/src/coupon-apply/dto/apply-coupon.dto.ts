// ============================================
// APPLY COUPON DTO
// ============================================

import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class ApplyCouponDto {
    @IsString()
    @IsNotEmpty({ message: 'Coupon code is required' })
    @MinLength(2, { message: 'Coupon code must be at least 2 characters' })
    @MaxLength(30, { message: 'Coupon code must be at most 30 characters' })
    code: string;
}
