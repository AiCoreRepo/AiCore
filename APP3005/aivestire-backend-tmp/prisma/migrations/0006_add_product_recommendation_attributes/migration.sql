-- ============================================================
-- Migration: 0006_add_product_recommendation_attributes
-- Description: Adds array columns to Product for recommendation
--   engine (occasions, body shapes, skin tones, sizes, age ranges).
-- ============================================================

ALTER TABLE "Product" ADD COLUMN "occasions"   TEXT[] DEFAULT '{}';
ALTER TABLE "Product" ADD COLUMN "body_shapes" TEXT[] DEFAULT '{}';
ALTER TABLE "Product" ADD COLUMN "skin_tones"  TEXT[] DEFAULT '{}';
ALTER TABLE "Product" ADD COLUMN "sizes"       TEXT[] DEFAULT '{}';
ALTER TABLE "Product" ADD COLUMN "age_ranges"  TEXT[] DEFAULT '{}';
