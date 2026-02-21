import { ApiProperty } from '@nestjs/swagger';

export class RecommendationItemDto {
  @ApiProperty({
    description: 'ML Model Item ID (cloth_id)',
    example: 'C001',
  })
  id: string;

  @ApiProperty({
    description: 'Database Product ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  product_id?: string;

  @ApiProperty({
    description: 'Product URL slug',
    example: 'elegant-silk-saree',
    required: false,
  })
  slug?: string;

  @ApiProperty({
    description: 'ML model score (0-1)',
    example: 0.85,
  })
  score: number;

  @ApiProperty({
    description: 'Final score after priority weighting',
    example: 0.92,
  })
  final_score: number;

  @ApiProperty({
    description: 'Category label',
    example: 'perfect for you',
  })
  score_label: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Elegant silk saree with traditional embroidery',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Primary product image URL (for backward compatibility)',
    required: false,
  })
  image?: string;

  @ApiProperty({
    description: 'Array of all product image URLs',
    type: [String],
    required: false,
  })
  images?: string[];

  @ApiProperty({
    description: 'Product title',
    required: false,
  })
  title?: string;

  @ApiProperty({
    description: 'Product price in cents',
    required: false,
  })
  price_cents?: number;

  @ApiProperty({
    description: 'Creator/Store name',
    required: false,
  })
  creator_name?: string;

  @ApiProperty({
    description: 'Inventory count',
    required: false,
  })
  inventory_count?: number;
}

export class RecommendationsResponseDto {
  @ApiProperty({
    description: 'Top tier recommendations (top 33%)',
    type: [RecommendationItemDto],
  })
  perfect_for_you: RecommendationItemDto[];

  @ApiProperty({
    description: 'Mid tier recommendations (middle 33%)',
    type: [RecommendationItemDto],
  })
  good_for_you: RecommendationItemDto[];

  @ApiProperty({
    description: 'Lower tier recommendations (bottom 33%)',
    type: [RecommendationItemDto],
  })
  you_can_also_try: RecommendationItemDto[];

  @ApiProperty({
    description: 'Total number of recommendations returned',
    example: 10,
  })
  count: number;

  @ApiProperty({
    description: 'Warning messages (if any)',
    type: [String],
    required: false,
  })
  warnings?: string[];
}
