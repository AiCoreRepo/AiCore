import { IsString, IsOptional, IsIn } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  token: string;

  @IsString()
  @IsIn(['CREATOR', 'BUYER', 'ADMIN'])
  role: 'CREATOR' | 'BUYER' | 'ADMIN';

  @IsOptional()
  @IsString()
  store_name?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
