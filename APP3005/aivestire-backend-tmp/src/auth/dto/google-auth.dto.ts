import { IsString, IsOptional, IsIn } from 'class-validator';

export class GoogleAuthDto {
    @IsString()
    token: string;

    @IsString()
    @IsIn(['CREATOR', 'BUYER'])
    role: 'CREATOR' | 'BUYER';

    @IsOptional()
    @IsString()
    store_name?: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;
}
