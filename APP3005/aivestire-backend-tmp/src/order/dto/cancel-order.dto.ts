import { IsString, IsOptional, MinLength } from 'class-validator';

export class CancelOrderDto {
    @IsString()
    @MinLength(3, { message: 'Cancellation reason is required' })
    reason: string; // Predefined reason code (e.g., CHANGE_OF_MIND, FOUND_BETTER_PRICE, OTHER)

    @IsOptional()
    @IsString()
    @MinLength(10, { message: 'Custom reason must be at least 10 characters' })
    customReason?: string; // Required when reason is 'OTHER'

    @IsOptional()
    @IsString()
    feedback?: string; // Optional feedback to improve brand
}
