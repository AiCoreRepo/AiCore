import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { StockLabelOverride } from './update-stock-extended.dto';

export class BulkStockItemDto {
  @IsUUID()
  product_id: string;

  @IsInt()
  @Min(0)
  inventory_count: number;

  @IsOptional()
  @IsEnum(StockLabelOverride)
  stock_label_override?: StockLabelOverride | null;
}

export class BulkUpdateStockDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkStockItemDto)
  items: BulkStockItemDto[];
}
