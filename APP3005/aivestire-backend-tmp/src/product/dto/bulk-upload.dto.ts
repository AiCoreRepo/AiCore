import { IsString, IsNumber, IsArray, IsOptional, Min, Max, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkProductDto {
    @ApiProperty({ description: 'Product title' })
    @IsString()
    title: string;

    @ApiProperty({ description: 'Product category' })
    @IsString()
    category: string;

    @ApiProperty({ description: 'Product description', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Price in cents', example: 5999 })
    @IsNumber()
    @Min(0)
    price_cents: number;

    @ApiProperty({ description: 'Base64 encoded image data' })
    @IsString()
    image_base64: string;

    @ApiProperty({ description: 'Occasions', example: ['Formal', 'Party'], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    occasions?: string[];

    @ApiProperty({ description: 'Body shapes', example: ['Rectangle', 'Hourglass'], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    body_shapes?: string[];

    @ApiProperty({ description: 'Skin tones', example: ['Light', 'Medium'], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skin_tones?: string[];

    @ApiProperty({ description: 'Available sizes', example: ['S', 'M', 'L'], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    sizes?: string[];
}

export class BulkUploadProductsDto {
    @ApiProperty({
        description: 'Array of products to upload (max 10)',
        type: [BulkProductDto],
        maxItems: 10,
        minItems: 1
    })
    @IsArray()
    @ArrayMinSize(1, { message: 'At least 1 product is required' })
    @ArrayMaxSize(10, { message: 'Maximum 10 products allowed per upload' })
    products: BulkProductDto[];
}

export class BulkUploadResponseDto {
    @ApiProperty({ description: 'Number of products successfully uploaded' })
    success_count: number;

    @ApiProperty({ description: 'Number of products that failed' })
    fail_count: number;

    @ApiProperty({ description: 'Array of created product IDs' })
    product_ids: string[];

    @ApiProperty({ description: 'Array of error messages for failed uploads' })
    errors: string[];

    @ApiProperty({ description: 'Overall status message' })
    message: string;
}
