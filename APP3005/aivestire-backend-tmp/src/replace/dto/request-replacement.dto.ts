import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ReplaceReason } from '@prisma/client';

export class RequestReplacementDto {
    @IsEnum(ReplaceReason)
    replace_reason: ReplaceReason;

    @IsString()
    @IsOptional()
    custom_reason?: string;

    @IsString()
    @IsOptional()
    feedback?: string;
}
