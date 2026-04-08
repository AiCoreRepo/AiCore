import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export enum StockLabelOverride {
  LOW = 'LOW',
  OK = 'OK',
  HIGH = 'HIGH',
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
}
