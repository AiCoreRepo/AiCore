import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class SaveCreatorAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @Length(2, 100, { message: 'Full name must be between 2 and 100 characters' })
  full_name: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: 'Enter a valid phone number',
  })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'Address line 1 is required' })
  @Length(5, 200, { message: 'Address must be between 5 and 200 characters' })
  address_line1: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  address_line2?: string;

  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  @Length(2, 100)
  city: string;

  @IsString()
  @IsNotEmpty({ message: 'State is required' })
  @Length(2, 100)
  state: string;

  @IsString()
  @IsNotEmpty({ message: 'Pincode is required' })
  @Matches(/^[1-9][0-9]{5}$/, { message: 'Enter a valid 6-digit pincode' })
  pincode: string;

  @IsOptional()
  @IsString()
  country?: string;
}
