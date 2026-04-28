import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpdateAdminProductDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  price_cents?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commission_percentage?: number;
}
