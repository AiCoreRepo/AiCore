import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsArray,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TagDto {
  @IsString()
  name!: string;
}

export class CreateProductDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  price_cents!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  inventory_count?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]; // base64 or file references for upload

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TagDto)
  tags?: TagDto[];
}
