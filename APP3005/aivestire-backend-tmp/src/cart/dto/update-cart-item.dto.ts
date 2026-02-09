import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartItemDto {
    @ApiProperty({
        description: 'New quantity for the cart item',
        example: 2,
        minimum: 1,
        maximum: 99,
    })
    @IsInt({ message: 'Quantity must be an integer' })
    @Min(1, { message: 'Quantity must be at least 1' })
    @Max(99, { message: 'Quantity cannot exceed 99' })
    quantity: number;
}
