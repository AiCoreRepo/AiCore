import { ApiProperty } from '@nestjs/swagger';

export class RecommendationItemDto {
    @ApiProperty({
        description: 'Product ID',
        example: 'C001',
    })
    id: string;

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
        description: 'Product image URL',
        required: false,
    })
    image?: string;

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
