// ============================================
// DEBIT WALLET DTO
// ============================================

import {
    IsNumber,
    IsOptional,
    IsString,
    Min,
    MaxLength,
} from 'class-validator';

export class DebitWalletDto {
    @IsNumber({}, { message: 'Amount must be a number' })
    @Min(0.01, { message: 'Amount must be greater than 0' })
    amount: number;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    referenceId?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    description?: string;
}
