import { IsUUID, IsInt, Min, Max, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToCartDto {
    @ApiProperty({
        description: 'Product ID to add to cart',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID('4', { message: 'Product ID must be a valid UUID' })
    product_id: string;

    @ApiProperty({
        description: 'Quantity of the product',
        example: 1,
        minimum: 1,
        maximum: 10,
        default: 1,
    })
    @IsOptional()
    @IsInt({ message: 'Quantity must be an integer' })
    @Min(1, { message: 'Quantity must be at least 1' })
    @Max(10, { message: 'Quantity cannot exceed 10' })
    quantity?: number = 1;

    @ApiPropertyOptional({
        description: 'Size variant of the product',
        example: 'M',
    })
    @IsOptional()
    @IsString()
    size?: string;

    @ApiPropertyOptional({
        description: 'Color variant of the product',
        example: 'Black',
    })
    @IsOptional()
    @IsString()
    color?: string;
}
