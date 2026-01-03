import { IsBoolean } from 'class-validator';

export class ToggleFeatureDto {
    @IsBoolean()
    is_featured: boolean;
}
