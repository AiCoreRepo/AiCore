import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToWishlistDto {
    @ApiProperty({
        description: 'Product ID to add to wishlist',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID('4', { message: 'Product ID must be a valid UUID' })
    product_id: string;
}
