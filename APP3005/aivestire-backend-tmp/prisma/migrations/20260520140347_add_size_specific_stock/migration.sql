-- AlterTable
ALTER TABLE "try_on_pack_purchases" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "product_color_size_stocks" (
    "size_stock_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "variant_id" UUID NOT NULL,
    "size" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_color_size_stocks_pkey" PRIMARY KEY ("size_stock_id")
);

-- CreateIndex
CREATE INDEX "product_color_size_stocks_variant_id_idx" ON "product_color_size_stocks"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_color_size_stocks_variant_id_size_key" ON "product_color_size_stocks"("variant_id", "size");

-- AddForeignKey
ALTER TABLE "product_color_size_stocks" ADD CONSTRAINT "product_color_size_stocks_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_color_variants"("variant_id") ON DELETE CASCADE ON UPDATE CASCADE;
