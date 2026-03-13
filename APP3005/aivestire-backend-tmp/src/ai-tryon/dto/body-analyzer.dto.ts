import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Request DTO for body analysis
 */
export class AnalyzeBodyDto {
  @ApiProperty({
    description: 'Base64 encoded image (with or without data URI prefix)',
    example: 'data:image/jpeg;base64,/9j/4AAQ...',
  })
  @IsString()
  imageBase64: string;
}

/**
 * Request DTO for body analysis with file upload
 */
export class AnalyzeBodyFileDto {
  // File is handled by FileInterceptor
}

/**
 * Response DTO for body analysis
 */
export class BodyAnalysisResultDto {
  @ApiProperty({
    description: 'Whether the analysis was successful',
    example: true,
  })
  success: boolean;

  @ApiPropertyOptional({
    description: 'Detected skin tone category',
    enum: ['Light', 'Medium', 'Dusky', 'Deep'],
    example: 'Light',
  })
  skinToneLabel?: string | null;

  @ApiProperty({
    description: 'Array of hex color codes representing skin tones',
    example: ['#c7c1e4', '#e1a298', '#e7cac2'],
    type: [String],
  })
  skinHexes: string[];

  @ApiPropertyOptional({
    description: 'Detected body shape category',
    enum: [
      'Rectangle',
      'Pear Shape',
      'Apple Shape',
      'Hourglass',
      'Inverted Triangle',
    ],
    example: 'Pear Shape',
  })
  bodyShape?: string | null;

  @ApiPropertyOptional({
    description: 'Explanation of the body shape decision or fallback',
    example:
      'full body detected, but body proportions were ambiguous; defaulted to rectangle',
  })
  bodyShapeReason?: string | null;

  @ApiProperty({
    description: 'Whether a full body was detected in the image',
    example: true,
  })
  fullBody: boolean;

  @ApiPropertyOptional({
    description: 'Error message if analysis failed',
    example: 'Image analysis failed: no person detected',
  })
  error?: string;

  @ApiPropertyOptional({
    description: 'Processing time in milliseconds',
    example: 1500,
  })
  processingTime?: number;
}

/**
 * Internal interface for FastAPI response (snake_case)
 */
export interface FastAPIBodyAnalysisResponse {
  skin_tone_label: 'Light' | 'Medium' | 'Dusky' | 'Deep' | null;
  skin_hexes: string[];
  body_shape:
    | 'Rectangle'
    | 'Pear Shape'
    | 'Apple Shape'
    | 'Hourglass'
    | 'Inverted Triangle'
    | null;
  body_shape_reason?: string | null;
  full_body: boolean;
}
