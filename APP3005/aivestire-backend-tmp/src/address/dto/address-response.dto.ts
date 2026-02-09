import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressResponseDto {
    @ApiProperty()
    address_id: string;

    @ApiProperty()
    user_id: string;

    @ApiProperty()
    full_name: string;

    @ApiProperty()
    phone: string;

    @ApiProperty()
    pincode: string;

    @ApiProperty()
    address_line1: string;

    @ApiPropertyOptional({ nullable: true })
    address_line2: string | null;

    @ApiProperty()
    city: string;

    @ApiProperty()
    state: string;

    @ApiPropertyOptional({ nullable: true })
    landmark: string | null;

    @ApiProperty()
    address_type: string;

    @ApiProperty()
    is_default: boolean;

    @ApiProperty()
    created_at: Date;

    @ApiProperty()
    updated_at: Date;
}
