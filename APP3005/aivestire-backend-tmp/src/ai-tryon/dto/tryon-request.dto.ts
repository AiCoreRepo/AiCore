import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsEnum,
    IsBase64,
    ValidateNested,
    IsObject,
    IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AIProvider } from '../enums/ai-provider.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for virtual try-on request
 */
export class TryOnRequestDto {
    @ApiProperty({
        description: 'Base64 encoded avatar image or image URL',
        example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    })
    @IsNotEmpty({ message: 'Avatar image is required' })
    @IsString()
    avatarImage: string;

    @ApiProperty({
        description: 'Base64 encoded clothing image or image URL',
        example: 'data:image/png;base64,iVBORw0KGgo...',
    })
    @IsNotEmpty({ message: 'Clothing image is required' })
    @IsString()
    clothingImage: string;

    @ApiPropertyOptional({
        description: 'AI provider to use for try-on',
        enum: AIProvider,
        example: AIProvider.GEMINI_AI,
    })
    @IsOptional()
    @IsEnum(AIProvider, { message: 'Invalid AI provider' })
    provider?: AIProvider;

    @ApiPropertyOptional({
        description: 'Additional parameters for AI processing',
        example: { quality: 'high', style: 'casual' },
    })
    @IsOptional()
    @IsObject()
    additionalParams?: Record<string, any>;
}

/**
 * DTO for file upload try-on request
 */
export class TryOnFileUploadDto {
    @ApiPropertyOptional({
        description: 'AI provider to use for try-on',
        enum: AIProvider,
        example: AIProvider.VERTEX_AI,
    })
    @IsOptional()
    @IsEnum(AIProvider)
    provider?: AIProvider;

    @ApiPropertyOptional({
        description: 'Additional parameters for AI processing',
    })
    @IsOptional()
    @IsObject()
    additionalParams?: Record<string, any>;
}

/**
 * DTO for batch try-on request
 */
export class BatchTryOnRequestDto {
    @ApiProperty({
        description: 'Array of try-on requests',
        type: [TryOnRequestDto],
    })
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => TryOnRequestDto)
    requests: TryOnRequestDto[];

    @ApiPropertyOptional({
        description: 'Default AI provider for all requests',
        enum: AIProvider,
    })
    @IsOptional()
    @IsEnum(AIProvider)
    defaultProvider?: AIProvider;
}

/**
 * DTO for 3D try-on request (with user ID and clothing item ID)
 */
export class TryOn3DRequestDto {
    @ApiProperty({
        description: 'User ID for Aura validation',
        example: 1,
    })
    @IsNotEmpty({ message: 'User ID is required' })
    @IsNumber()
    userId: number;

    @ApiProperty({
        description: 'Clothing item ID from collection',
        example: 123,
    })
    @IsNotEmpty({ message: 'Clothing item ID is required' })
    @IsNumber()
    clothingItemId: number;

    @ApiPropertyOptional({
        description: 'Additional parameters for AI processing',
        example: { quality: 'high', style: 'casual' },
    })
    @IsOptional()
    @IsObject()
    additionalParams?: Record<string, any>;
}

/**
 * DTO for generating more angles from existing try-on image
 */
export class GenerateAnglesRequestDto {
    @ApiProperty({
        description: 'User ID for Aura validation',
        example: 1,
    })
    @IsNotEmpty({ message: 'User ID is required' })
    @IsNumber()
    userId: number;

    @ApiProperty({
        description: 'URL or base64 of previous try-on image',
        example: 'https://example.com/tryon-result.jpg',
    })
    @IsNotEmpty({ message: 'Previous image is required' })
    @IsString()
    previousImageUrl: string;

    @ApiPropertyOptional({
        description: 'Additional parameters for angle generation',
        example: { angle: 'side', background: 'studio' },
    })
    @IsOptional()
    @IsObject()
    additionalParams?: Record<string, any>;
}
