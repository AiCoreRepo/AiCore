// ============================================
// CREATE COUPON SCOPE DTO
// ============================================

import {
    IsString,
    IsEnum,
    IsNumber,
    IsOptional,
    Min,
} from 'class-validator';
import { CouponScopeType } from '../enums/scope-type.enum';

export class CreateCouponScopeDto {
    @IsEnum(CouponScopeType, { message: 'Scope type must be one of: GLOBAL, PRICE_LEVEL, FESTIVAL, USER, COMPANY_SPECIAL, COLLECTION' })
    scopeType: CouponScopeType;

    // Required when scopeType === PRICE_LEVEL
    @IsNumber({}, { message: 'Min price must be a number' })
    @Min(0, { message: 'Min price cannot be negative' })
    @IsOptional()
    minPrice?: number;

    @IsNumber({}, { message: 'Max price must be a number' })
    @Min(0, { message: 'Max price cannot be negative' })
    @IsOptional()
    maxPrice?: number;

    // Required when scopeType === FESTIVAL
    @IsString({ message: 'Festival key must be a string' })
    @IsOptional()
    festivalKey?: string;
}
