import { IsUUID, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
        maximum: 99,
        default: 1,
    })
    @IsOptional()
    @IsInt({ message: 'Quantity must be an integer' })
    @Min(1, { message: 'Quantity must be at least 1' })
    @Max(99, { message: 'Quantity cannot exceed 99' })
    quantity?: number = 1;
}
