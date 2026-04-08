import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsObject,
  IsUUID,
} from 'class-validator';
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
    description: 'Additional parameters for AI processing',
    example: { quality: 'high', style: 'casual' },
  })
  @IsOptional()
  @IsObject()
  additionalParams?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Product ID (UUID) used for persisting try-on history',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Product ID must be a valid UUID' })
  productId?: string;

  @ApiPropertyOptional({
    description: 'Aura ID (UUID) used for persisting try-on history',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Aura ID must be a valid UUID' })
  auraId?: string;
}
