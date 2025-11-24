import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  refresh_token?: string;
}
