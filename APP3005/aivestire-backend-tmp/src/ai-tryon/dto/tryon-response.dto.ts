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

    @ApiProperty({
        description: 'Timestamp of completion',
        example: '2025-12-29T16:10:00.000Z',
    })
    timestamp: string;
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
