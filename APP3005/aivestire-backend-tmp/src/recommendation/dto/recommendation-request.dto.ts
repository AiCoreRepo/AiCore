import { IsEnum, IsNumber, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  Occasion,
  BodyShape,
  SkinTone,
  Size,
} from '../enums/recommendation.enum';

export class GetRecommendationsDto {
  @ApiProperty({
    description: 'Occasion for which recommendations are needed',
    enum: Occasion,
    example: Occasion.FORMAL,
  })
  @IsEnum(Occasion)
  occasion: Occasion;

  @ApiProperty({
    description: 'Number of recommendations to return',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  top_k?: number = 10;

  @ApiProperty({
    description:
      'User body shape (optional, will use Aura data if not provided)',
    enum: BodyShape,
    required: false,
  })
  @IsOptional()
  @IsEnum(BodyShape)
  body_shape?: BodyShape;

  @ApiProperty({
    description:
      'User skin tone (optional, will use Aura data if not provided)',
    enum: SkinTone,
    required: false,
  })
  @IsOptional()
  @IsEnum(SkinTone)
  skin_tone?: SkinTone;

  @ApiProperty({
    description: 'User size (optional, will use Aura data if not provided)',
    enum: Size,
    required: false,
  })
  @IsOptional()
  @IsEnum(Size)
  size?: Size;

  @ApiProperty({
    description: 'User age (optional, will use Aura data if not provided)',
    example: 25,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(13)
  @Max(100)
  age?: number;
}
