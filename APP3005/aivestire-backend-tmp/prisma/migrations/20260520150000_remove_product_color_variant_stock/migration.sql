-- Stock is maintained per size in product_color_size_stocks, not on color variants.
ALTER TABLE "product_color_variants" DROP COLUMN IF EXISTS "stock";
