import {
  IsInt,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { FeedbackContextType } from '@prisma/client';

export class SubmitFeedbackDto {
  @IsEnum(FeedbackContextType, {
    message:
      'context_type must be AVATAR_CREATION, AVATAR_RECREATION, or VIRTUAL_TRYON',
  })
  context_type: FeedbackContextType;

  @IsUUID()
  @IsOptional()
  context_reference_id?: string;

  @IsString()
  @IsOptional()
  context_label?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
