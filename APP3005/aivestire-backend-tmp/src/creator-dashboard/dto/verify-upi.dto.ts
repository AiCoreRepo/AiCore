import { IsString, Matches } from 'class-validator';

const UPI_ID_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;

export class VerifyUpiDto {
  @IsString()
  @Matches(UPI_ID_REGEX, {
    message: 'Enter a valid UPI ID like yourname@upi.',
  })
  upiId!: string;
}
