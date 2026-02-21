import { IsString, Length, IsNotEmpty, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+\d{10,15}$/, {
    message:
      'phoneNumber must be a valid international phone number with country code',
  })
  phoneNumber!: string;

  @IsString()
  @Length(4, 4)
  otp!: string;
}
