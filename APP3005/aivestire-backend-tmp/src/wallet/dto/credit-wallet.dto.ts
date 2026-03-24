// ============================================
// CREDIT WALLET DTO
// ============================================

import {
    IsNumber,
    IsEnum,
    IsOptional,
    IsString,
    Min,
    MaxLength,
} from 'class-validator';
import { WalletTransactionSource } from '@prisma/client';

export class CreditWalletDto {
    @IsNumber({}, { message: 'Amount must be a number' })
    @Min(0.01, { message: 'Amount must be greater than 0' })
    amount: number;

    @IsEnum(WalletTransactionSource, {
        message: 'Source must be REFUND, CASHBACK, ORDER_PAYMENT, ADMIN_CREDIT, or PROMOTION',
    })
    source: WalletTransactionSource;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    referenceId?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    description?: string;
}
