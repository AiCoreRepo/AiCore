-- AlterTable
ALTER TABLE "Product" ADD COLUMN "metadata" JSONB;

-- Add comment
COMMENT ON COLUMN "Product"."metadata" IS 'Stores recommendation attributes: occasions, body_shapes, skin_tones, sizes, fit, fabric, color_family, style';
