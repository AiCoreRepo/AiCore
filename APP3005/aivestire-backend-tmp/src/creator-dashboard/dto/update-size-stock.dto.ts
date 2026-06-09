import { IsInt, Min } from 'class-validator';

export class UpdateSizeStockDto {
  @IsInt()
  @Min(0)
  stock: number;
}
