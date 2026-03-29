-- Migration: Add recommendation attribute columns to Product
-- These store which body shapes, occasions, skin tones, sizes, and age ranges a garment suits

ALTER TABLE "Product" ADD COLUMN "occasions" TEXT[] DEFAULT '{}';
ALTER TABLE "Product" ADD COLUMN "body_shapes" TEXT[] DEFAULT '{}';
ALTER TABLE "Product" ADD COLUMN "skin_tones" TEXT[] DEFAULT '{}';
ALTER TABLE "Product" ADD COLUMN "sizes" TEXT[] DEFAULT '{}';
ALTER TABLE "Product" ADD COLUMN "age_ranges" TEXT[] DEFAULT '{}';
