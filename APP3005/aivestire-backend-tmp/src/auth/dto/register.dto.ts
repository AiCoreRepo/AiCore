import {
  IsEmail,
  IsString,
  MinLength,
  IsIn,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @Transform(({ value }) => value as UserRole)
  @IsIn([UserRole.BUYER, UserRole.CREATOR, UserRole.ADMIN], {
    message: 'role must be one of the following values: BUYER, CREATOR, ADMIN'
  })
  role!: UserRole;

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
