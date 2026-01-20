import { IsNotEmpty, IsString, MaxLength, IsOptional, IsArray } from 'class-validator';

export class CreateCommentDto {
    @IsNotEmpty()
    @IsString()
    product_id: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(1000, { message: 'Comment cannot exceed 1000 characters' })
    comment_text: string;

    @IsOptional()
    @IsArray()
    images?: string[];
}
