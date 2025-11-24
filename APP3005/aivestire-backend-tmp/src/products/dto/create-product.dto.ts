import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
  IsArray,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  title: string;

  @IsString()
  creator_id: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsInt()
  @Min(0)
  price_cents: number;

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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
