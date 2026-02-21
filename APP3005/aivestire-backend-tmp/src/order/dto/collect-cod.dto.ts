import { IsNumber, IsUUID, IsOptional, IsString, Min } from 'class-validator';

export class CollectCODDto {
  @IsNumber()
  @Min(0)
  collectedAmount: number;

  @IsUUID()
  collectedBy: string;

  @IsOptional()
  @IsString()
  paymentProof?: string;
}
