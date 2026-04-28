import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class SyncAdminClothFolderDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  folder_path?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  cloudinary_folder?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  default_category?: string;

  @IsOptional()
  @IsBoolean()
  auto_approve?: boolean;
}
