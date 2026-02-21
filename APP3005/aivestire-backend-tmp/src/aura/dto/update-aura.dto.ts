import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateAuraDto {
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

  @IsOptional()
  @IsString()
  skinTone?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  bodyShape?: string;

  @IsOptional()
  @IsString()
  bodyType?: string; // Added new field

  @IsOptional()
  @IsString()
  bodySize?: string; // Added new field for body size

  @IsOptional()
  @IsString()
  ageRange?: string;

  @IsOptional()
  @IsString()
  hairStyle?: string;

  @IsOptional()
  @IsString()
  beardStyle?: string;
}
