import {
  IsEmail,
  IsString,
  MinLength,
  IsIn,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsIn(['buyer', 'creator', 'admin'])
  role!: 'buyer' | 'creator' | 'admin';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  store_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  store_slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  about?: string;
}
