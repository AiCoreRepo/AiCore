import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class UpdateBirthdayDto {
    @IsString()
    @IsNotEmpty()
    @IsDateString({}, { message: 'Date of birth must be a valid ISO date string' })
    dateOfBirth: string;
}
