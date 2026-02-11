import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsEnum,
    IsBoolean,
    Matches,
    Length,
} from 'class-validator';

export enum AddressType {
    HOME = 'HOME',
    WORK = 'WORK',
    OTHER = 'OTHER',
}

export class CreateAddressDto {
    @ApiProperty({ description: 'Full name of the recipient' })
    @IsString()
    @IsNotEmpty()
    @Length(2, 100)
    full_name: string;

    @ApiProperty({ description: 'Phone number (10 digits)' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^[6-9]\d{9}$/, { message: 'Phone must be a valid 10-digit Indian mobile number' })
    phone: string;

    @ApiProperty({ description: 'Pincode (6 digits)' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{6}$/, { message: 'Pincode must be 6 digits' })
    pincode: string;

    @ApiProperty({ description: 'House No, Building, Street' })
    @IsString()
    @IsNotEmpty()
    @Length(5, 200)
    address_line1: string;

    @ApiPropertyOptional({ description: 'Locality, Area' })
    @IsString()
    @IsOptional()
    @Length(0, 200)
    address_line2?: string;

    @ApiProperty({ description: 'City name' })
    @IsString()
    @IsNotEmpty()
    @Length(2, 100)
    city: string;

    @ApiProperty({ description: 'State name' })
    @IsString()
    @IsNotEmpty()
    @Length(2, 100)
    state: string;

    @ApiPropertyOptional({ description: 'Landmark (optional)' })
    @IsString()
    @IsOptional()
    @Length(0, 100)
    landmark?: string;

    @ApiProperty({ enum: AddressType, default: AddressType.HOME })
    @IsEnum(AddressType)
    @IsOptional()
    address_type?: AddressType = AddressType.HOME;

    @ApiPropertyOptional({ description: 'Set as default address', default: false })
    @IsBoolean()
    @IsOptional()
    is_default?: boolean = false;
}
