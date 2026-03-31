// ============================================
// ADMIN CREDIT WALLET DTO
// ============================================

import {
    IsNumber,
    IsString,
    IsOptional,
    IsUUID,
    Min,
    MaxLength,
} from 'class-validator';

export class AdminCreditDto {
    @IsUUID('4', { message: 'User ID must be a valid UUID' })
    userId: string;

    @IsNumber({}, { message: 'Amount must be a number' })
    @Min(0.01, { message: 'Amount must be greater than 0' })
    amount: number;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    description?: string;
}
