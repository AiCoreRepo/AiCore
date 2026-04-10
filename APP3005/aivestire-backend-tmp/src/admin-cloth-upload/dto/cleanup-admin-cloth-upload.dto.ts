import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CleanupAdminClothUploadDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  source_folder?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsBoolean()
  dry_run?: boolean;

  @IsOptional()
  @IsBoolean()
  hard_delete?: boolean;
}
