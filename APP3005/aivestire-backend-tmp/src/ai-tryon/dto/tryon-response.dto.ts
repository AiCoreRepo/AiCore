import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AIProvider, TryOnStatus } from '../enums/ai-provider.enum';

/**
 * Response DTO for successful try-on
 */
export class TryOnResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Base64 encoded result image',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  })
  resultImage: string;

  @ApiProperty({
    description: 'AI provider used',
    enum: AIProvider,
    example: AIProvider.GEMINI_AI,
  })
  provider: AIProvider;

  @ApiProperty({
    description: 'Processing status',
    enum: TryOnStatus,
    example: TryOnStatus.SUCCESS,
  })
  status: TryOnStatus;

  @ApiProperty({
    description: 'Processing time in milliseconds',
    example: 3542,
  })
  processingTimeMs: number;

  @ApiPropertyOptional({
    description: 'Additional metadata from AI service',
    example: { model: 'gemini-1.5-pro', quality: 'high' },
  })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Try-on record identifier for feedback and reporting',
    example: 'a12b34c5-d678-90ab-cdef-1234567890ab',
  })
  tryOnId?: string;

  @ApiProperty({
    description: 'Timestamp of completion',
    example: '2025-12-29T16:10:00.000Z',
  })
  timestamp: string;
}

export class TryOnQueuedResponseDto {
  @ApiProperty({
    description: 'Whether the try-on job was accepted successfully',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Current async processing status',
    enum: TryOnStatus,
    example: TryOnStatus.PENDING,
  })
  status: TryOnStatus;

  @ApiProperty({
    description: 'Background job identifier',
    example: '42',
  })
  jobId: string;

  @ApiProperty({
    description: 'Human-readable status message',
    example: 'Try-on job queued successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp when the job was queued',
    example: '2026-04-02T12:00:00.000Z',
  })
  timestamp: string;
}

export class TryOnJobStatusResponseDto {
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
    example: 65,
  })
  progress: number;

  @ApiPropertyOptional({
    description: 'Completed try-on result',
    type: TryOnResponseDto,
  })
  result?: TryOnResponseDto;

  @ApiPropertyOptional({
    description: 'Failure reason when the background job fails',
    example: 'Vertex AI request timed out',
  })
  error?: string;
}

/**
 * Response DTO for error cases
 */
export class TryOnErrorResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'Error code',
    example: 'IMAGE_TOO_LARGE',
  })
  errorCode: string;

  @ApiProperty({
    description: 'Error message',
    example: 'Image size exceeds maximum limit of 10MB',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Additional error details',
  })
  details?: any;

  @ApiProperty({
    description: 'Timestamp of error',
    example: '2025-12-29T16:10:00.000Z',
  })
  timestamp: string;
}

/**
 * Response DTO for health check
 */
export class HealthCheckResponseDto {
  @ApiProperty({
    description: 'Overall service health',
    example: true,
  })
  healthy: boolean;

  @ApiProperty({
    description: 'Vertex AI service status',
    example: { available: true, configured: true },
  })
  vertexAI: {
    available: boolean;
    configured: boolean;
    message?: string;
  };

  @ApiProperty({
    description: 'Gemini AI service status',
    example: { available: true, configured: true },
  })
  geminiAI: {
    available: boolean;
    configured: boolean;
    message?: string;
  };

  @ApiProperty({
    description: 'Timestamp of health check',
    example: '2025-12-29T16:10:00.000Z',
  })
  timestamp: string;
}

/**
 * Response DTO for batch try-on
 */
export class BatchTryOnResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Array of try-on results',
    type: [TryOnResponseDto],
  })
  results: TryOnResponseDto[];

  @ApiProperty({
    description: 'Number of successful try-ons',
    example: 8,
  })
  successCount: number;

  @ApiProperty({
    description: 'Number of failed try-ons',
    example: 2,
  })
  failureCount: number;

  @ApiProperty({
    description: 'Total processing time in milliseconds',
    example: 15420,
  })
  totalProcessingTimeMs: number;

  @ApiProperty({
    description: 'Timestamp of completion',
    example: '2025-12-29T16:10:00.000Z',
  })
  timestamp: string;
}
