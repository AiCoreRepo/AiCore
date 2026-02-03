import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class SendOtpDto {
    @IsNotEmpty()
    @IsString()
    @Matches(/^\+\d{10,15}$/, { message: 'phoneNumber must be a valid international phone number with country code' })
    phoneNumber!: string;
}
