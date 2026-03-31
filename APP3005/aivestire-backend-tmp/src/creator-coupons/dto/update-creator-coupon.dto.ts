import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, Max, MinLength } from 'class-validator';

export class UpdateCreatorCouponDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    minOrderAmount?: number;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    maxUsage?: number;
}
