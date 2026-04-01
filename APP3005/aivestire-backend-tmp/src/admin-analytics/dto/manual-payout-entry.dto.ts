import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PayoutStatusEnum, PayoutTypeEnum } from '../enums/payout.enums';

export class ManualPayoutEntryDto {
  @IsString()
  @IsNotEmpty()
  creatorId: string;

  @IsNumber()
  @Min(1, { message: 'Payout amount must be at least ₹1' })
  @Max(500000, { message: 'Payout amount cannot exceed ₹5,00,000' })
  amount: number;

  @IsOptional()
  @IsEnum(PayoutTypeEnum)
  payoutType?: PayoutTypeEnum;

  @IsEnum(PayoutStatusEnum)
  status: PayoutStatusEnum;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}