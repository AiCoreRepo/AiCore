import { IsDateString, IsString, IsOptional } from 'class-validator';

export class SchedulePickupDto {
  @IsDateString()
  pickup_date: string;

  @IsString()
  pickup_partner: string;

  @IsString()
  @IsOptional()
  pickup_tracking?: string;
}
