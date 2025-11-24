import { IsString, IsOptional, IsInt, Min, MaxLength } from 'class-validator';

export class CreateOwnProductDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsInt()
  @Min(0)
  price_cents!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  inventory_count?: number;
}
