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

export class AngleQueuedResponseDto {
  @ApiProperty({
    description: 'Whether the angle generation job was accepted successfully',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Current async processing status',
    example: 'pending',
  })
  status: string;

  @ApiProperty({
    description: 'Background job identifier',
    example: '84',
  })
  jobId: string;

  @ApiProperty({
    description: 'Human-readable status message',
    example: 'Angle generation job queued successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp when the job was queued',
    example: '2026-04-09T12:00:00.000Z',
  })
  timestamp: string;
}

export class AngleJobStatusResponseDto {
  @ApiProperty({
    description: 'Whether the job exists and is available to the current user',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Background job state',
    example: 'active',
  })
  status: string;

  @ApiProperty({
    description: 'Job progress percentage',
    example: 55,
  })
  progress: number;

  @ApiProperty({
    description: 'Completed angle generation result',
    required: false,
    type: GenerateAnglesResponseDto,
  })
  result?: GenerateAnglesResponseDto;

  @ApiProperty({
    description: 'Failure reason when the background job fails',
    required: false,
    example: 'Gemini AI generation failed: request timed out',
  })
  error?: string;
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
