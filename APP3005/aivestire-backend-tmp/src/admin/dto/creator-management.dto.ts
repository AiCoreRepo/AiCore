import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum CreatorStatusFilter {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class GetCreatorsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(CreatorStatusFilter)
  status?: CreatorStatusFilter;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class ToggleCreatorStatusDto {
  @IsEnum(['ACTIVE', 'INACTIVE'])
  action: 'ACTIVE' | 'INACTIVE';
}
