import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsOptional, IsString, IsArray, IsEnum } from 'class-validator';
import { ProductStatus } from '@prisma/client';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
