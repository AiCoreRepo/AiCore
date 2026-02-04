import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsObject } from 'class-validator';
import { AngleType } from '../enums/angle.enum';


export class GenerateAnglesRequestDto {
    @ApiProperty({
        description: 'URL or base64 of the previous try-on result image',
        example: 'https://res.cloudinary.com/...',
    })
    @IsString()
    previousImageUrl: string;

    @ApiProperty({
        description: 'Product ID (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    productId: string;

    @ApiProperty({
        description: 'Aura ID (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174001',
    })
    @IsUUID()
    auraId: string;

    @ApiProperty({
        description: 'Optional: Specific angle to generate (if not provided, auto-determines next in sequence)',
        enum: AngleType,
        required: false,
    })
    @IsOptional()
    @IsString()
    angle?: AngleType;

    @ApiProperty({
        description: 'Optional: Cached metadata for optimization',
        required: false,
        example: { width: 1024, height: 1024, dominantColors: ['#FF5733', '#C70039'] },
    })
    @IsOptional()
    @IsObject()
    cachedMetadata?: Record<string, any>;
}

/**
 * Request DTO for resetting angle session
 */
export class ResetAngleSessionDto {
    @ApiProperty({
        description: 'User ID',
        example: '123e4567-e89b-12d3-a456-426614174002',
    })
    @IsUUID()
    userId: string;

    @ApiProperty({
        description: 'Product ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    productId: string;
}
