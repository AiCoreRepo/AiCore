import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { VerifyPaymentDto } from '../../payment/dto/payment.dto';
import { TRY_ON_PACK_IDS } from '../try-on-pack-purchases.constants';

export class InitiateTryOnPackPurchaseDto {
  @IsString()
  @IsIn(TRY_ON_PACK_IDS)
  planId: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  returnPath?: string;
}

export class VerifyTryOnPackPurchaseDto extends VerifyPaymentDto {}
