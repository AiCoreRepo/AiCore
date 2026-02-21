-- Add image_urls column to product_comments
ALTER TABLE "product_comments" ADD COLUMN "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[];