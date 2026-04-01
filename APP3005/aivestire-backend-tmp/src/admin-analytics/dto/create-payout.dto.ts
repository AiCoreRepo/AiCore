import { IsPositive, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePayoutDto {
  @IsUUID()
  creatorId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}
