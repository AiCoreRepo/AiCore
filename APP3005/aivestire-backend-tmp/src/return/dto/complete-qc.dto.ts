import { IsBoolean, IsString, IsOptional } from 'class-validator';

export class CompleteQCDto {
  @IsBoolean()
  qc_passed: boolean;

  @IsString()
  @IsOptional()
  qc_notes?: string;
}
