import { ApiProperty } from '@nestjs/swagger';
import { AngleType } from '../enums/angle.enum';

/**
 * Response DTO for angle generation
 */
export class GenerateAnglesResponseDto {
  @ApiProperty({
    description: 'Whether the generation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Base64 encoded result image (with data URI prefix)',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  })
  resultImage: string;

  @ApiProperty({
    description: 'The angle that was generated',
    enum: AngleType,
    example: AngleType.BACK,
  })
  angle: AngleType;

  @ApiProperty({
    description: 'Processing time in milliseconds',
    example: 5432,
  })
  processingTimeMs: number;

  @ApiProperty({
    description: 'Timestamp of generation',
    example: '2026-01-25T00:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Additional metadata about the generation',
    example: {
      cachingUsed: true,
      sessionKey: 'user123_product456',
      modelId: 'gemini-3.1-flash-image-preview',
      referenceStrategy: 'single_original_tryon_image',
    },
  })
  metadata: {
    cachingUsed: boolean;
    sessionKey: string;
    modelId: string;
    fullResolutionUsed?: boolean;
    imageSizeKB?: number;
    referenceStrategy?: 'single_original_tryon_image';
  };

  @ApiProperty({
    description: 'Try-on record identifier for feedback and follow-up actions',
    required: false,
    example: 'a12b34c5-d678-90ab-cdef-1234567890ab',
  })
  tryOnId?: string;
}

/**
 * Response DTO for session reset
 */
export class ResetAngleSessionResponseDto {
  @ApiProperty({
    description: 'Whether the reset was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Message describing the result',
    example: 'Angle session reset successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Session key that was reset',
    example: 'user123_product456',
  })
  sessionKey: string;
}
