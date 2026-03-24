import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AssignProductsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  product_ids: string[];
}
