import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, Matches } from 'class-validator';
import { PayoutTypeEnum } from '../enums/payout.enums';

export class InitiatePayoutDto {
  @IsString()
  @IsNotEmpty()
  creatorId: string;

  @IsNumber()
  @Min(1, { message: 'Payout amount must be at least ₹1' })
  @Max(500000, { message: 'Payout amount cannot exceed ₹5,00,000' })
  amount: number;

  @IsEnum(PayoutTypeEnum)
  payoutType: PayoutTypeEnum;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9._\-]+@[a-zA-Z0-9]+$/, {
    message: 'Invalid UPI ID format. Example: user@upi',
  })
  upiId: string;

  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Invalid Indian phone number. Must be 10 digits starting with 6-9',
  })
  phoneNumber: string;

  @IsOptional()
  @IsString()
  note?: string;
}
