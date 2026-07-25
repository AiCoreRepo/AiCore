import { IsOptional, IsNumber, IsString, Min, Max, IsNotEmpty, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAuraDto {
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  @Min(100)
  @Max(250)
  height?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  @Min(30)
  @Max(200)
  weight?: number;

  @IsString()
  @IsNotEmpty()
  skinTone: string;

  @IsOptional()
  @IsString()
  @IsIn(['female', 'male'])
  gender?: string;

  @IsString()
  @IsNotEmpty()
  bodyShape: string;

  @IsOptional()
  @IsString()
  bodyType?: string; // Added new field

  @IsString()
  @IsNotEmpty()
  bodySize: string; // Added new field for body size

  @IsOptional()
  @IsString()
  ageRange?: string;

  @IsOptional()
  @IsString()
  hairStyle?: string;
}
