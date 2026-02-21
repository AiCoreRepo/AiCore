import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ReturnReason } from '@prisma/client';

export class RequestReturnDto {
  @IsEnum(ReturnReason)
  return_reason: ReturnReason;

  @IsString()
  @IsOptional()
  custom_reason?: string;

  @IsString()
  @IsOptional()
  feedback?: string;
}
