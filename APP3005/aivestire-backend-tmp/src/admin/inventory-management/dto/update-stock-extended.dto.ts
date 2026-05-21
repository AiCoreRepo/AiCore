import { IsEnum, IsInt, IsOptional, Min, IsArray, ValidateNested, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export enum StockLabelOverride {
  LOW = 'LOW',
  OK = 'OK',
  HIGH = 'HIGH',
}

export class SizeStockUpdateDto {
  @IsString()
  @IsNotEmpty()
  size: string;

  @IsInt()
  @Min(0)
  stock: number;
}

export class VariantSizeStockUpdateDto {
  @IsString()
  @IsNotEmpty()
  variant_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SizeStockUpdateDto)
  size_stocks: SizeStockUpdateDto[];
}

export class UpdateStockExtendedDto {
  @IsInt()
  @Min(0)
  inventory_count: number;

  /**
   * Optional manual override for stock label.
   * If null/undefined, label is auto-computed from thresholds.
   */
  @IsOptional()
  @IsEnum(StockLabelOverride)
  stock_label_override?: StockLabelOverride | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantSizeStockUpdateDto)
  variants?: VariantSizeStockUpdateDto[];
}

