import { IsEmail, IsIn, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ description: 'Email address of the account to reset' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Role of the account (BUYER or CREATOR). Used to scope the lookup.',
    enum: ['BUYER', 'CREATOR'],
    required: false,
  })
  @IsOptional()
  @IsIn(['BUYER', 'CREATOR'])
  role?: 'BUYER' | 'CREATOR';
}
