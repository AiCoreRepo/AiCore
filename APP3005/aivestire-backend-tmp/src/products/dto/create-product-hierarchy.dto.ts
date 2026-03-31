import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsArray,
  Min,
  Max,
  MaxLength,
  ValidateNested,
  ArrayMinSize,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  BodyShape,
  SkinTone,
  ClothingColor,
} from '../../common/constants/product-enums';

// ============================================
// COLOR VARIANT DTO
// ============================================

export class CreateColorVariantDto {
  /**
   * The clothing color enum value for this variant.
   * Drives AI skin-tone recommendation.
   */
  @IsEnum(ClothingColor, {
    message: `color must be a valid ClothingColor value`,
  })
  color: ClothingColor;

  /**
   * Optional custom hex override for UI display (e.g. "#FF5733").
   */
  @IsOptional()
  @IsString()
  @MaxLength(7)
  hex_code?: string;

  /**
   * Stock quantity for this specific color.
   */
  @IsInt()
  @Min(0)
  @Max(99999)
  stock: number;

  /**
   * Skin tones this color suits best.
   * Used for AI-powered personalized recommendations.
   */
  @IsArray()
  @IsEnum(SkinTone, { each: true, message: 'each skin_tone must be a valid SkinTone value' })
  @ArrayMinSize(1, { message: 'At least one skin tone must be selected' })
  skin_tones: SkinTone[];

  /**
   * Base64-encoded images for this color variant.
   * At least 1 image is required.
   */
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least one image is required per color variant' })
  images: string[];
}

// ============================================
// PATTERN DTO
// ============================================

export class CreatePatternDto {
  /**
   * Descriptive name for this pattern/fit.
   * e.g. "Slim Fit", "Relaxed Fit", "Oversized"
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  /**
   * Body shapes this pattern suits best.
   * Used for AI-powered fit recommendation.
   */
  @IsArray()
  @IsEnum(BodyShape, { each: true, message: 'each body_shape must be a valid BodyShape value' })
  @ArrayMinSize(1, { message: 'At least one body shape must be selected' })
  body_shapes: BodyShape[];

  /**
   * One or more color variants for this pattern.
   * Each color represents a distinct appearance option.
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateColorVariantDto)
  @ArrayMinSize(1, { message: 'Each pattern must have at least one color variant' })
  color_variants: CreateColorVariantDto[];
}

// ============================================
// PRODUCT HIERARCHY DTO  (top-level submitted by creator)
// ============================================

export class CreateProductHierarchyDto {
  // ── Product Info ─────────────────────────────

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  /**
   * Price in smallest currency unit (paise for INR).
   * e.g. ₹499 → 49900
   */
  @IsInt()
  @Min(1)
  price_cents: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsString()
  sub_category_id?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  group_ids?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  age_ranges?: string[];

  // ── Pattern Hierarchy ─────────────────────────

  /**
   * At least 1 pattern is required.
   * Each pattern groups color variants by body-shape fit.
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePatternDto)
  @ArrayMinSize(1, { message: 'At least one pattern is required' })
  patterns: CreatePatternDto[];
}
