import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { DEFAULT_LOW_STOCK_THRESHOLD, DEFAULT_HIGH_STOCK_THRESHOLD } from '../inventory.constants';

export enum StockStatusFilter {
  ALL = 'ALL',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  LOW = 'LOW',
  OK = 'OK',
  HIGH = 'HIGH',
}

export class GetInventoryQueryDto {
  @IsOptional()
  @IsEnum(StockStatusFilter)
  stock_status?: StockStatusFilter;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  creator_id?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  /**
   * Custom threshold below which stock is labelled LOW (inclusive).
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  low_threshold?: number = DEFAULT_LOW_STOCK_THRESHOLD;

  /**
   * Custom threshold above which stock is labelled HIGH (inclusive).
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  high_threshold?: number = DEFAULT_HIGH_STOCK_THRESHOLD;
}
