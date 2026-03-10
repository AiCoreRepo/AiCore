import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProductGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  parent_id?: string;
}
