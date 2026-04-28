/*
  Warnings:

  - Added the required column `commission` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creator_id` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creator_price` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `selling_price` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable (Add nullable first)
ALTER TABLE "order_items" ADD COLUMN     "commission" DECIMAL(10,2),
ADD COLUMN     "creator_id" UUID,
ADD COLUMN     "creator_price" DECIMAL(10,2),
ADD COLUMN     "delivered_at" TIMESTAMP(3),
ADD COLUMN     "order_status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "selling_price" DECIMAL(10,2);

-- Backfill Data from Product
UPDATE "order_items"
SET 
  "creator_id" = p."creator_id",
  "selling_price" = "unit_price",
  "commission" = ("unit_price" * p."commission_percentage" / 100.0),
  "creator_price" = "unit_price" - ("unit_price" * p."commission_percentage" / 100.0)
FROM "Product" p
WHERE "order_items"."product_id" = p."product_id";

-- Fallback for any orphaned order_items (though shouldn't exist due to constraints)
UPDATE "order_items"
SET
  "creator_id" = '00000000-0000-0000-0000-000000000000'::uuid,
  "selling_price" = "unit_price",
  "commission" = 0,
  "creator_price" = "unit_price"
WHERE "creator_id" IS NULL;

-- AlterTable (Set NOT NULL)
ALTER TABLE "order_items" 
ALTER COLUMN "commission" SET NOT NULL,
ALTER COLUMN "creator_id" SET NOT NULL,
ALTER COLUMN "creator_price" SET NOT NULL,
ALTER COLUMN "selling_price" SET NOT NULL;

-- CreateTable
CREATE TABLE "payouts" (
    "payout_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "creator_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("payout_id")
);

-- CreateIndex
CREATE INDEX "payouts_creator_id_idx" ON "payouts"("creator_id");

-- CreateIndex
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

-- CreateIndex
CREATE INDEX "payouts_creator_id_status_idx" ON "payouts"("creator_id", "status");

-- CreateIndex
CREATE INDEX "order_items_creator_id_idx" ON "order_items"("creator_id");

-- CreateIndex
CREATE INDEX "order_items_order_status_idx" ON "order_items"("order_status");

-- CreateIndex
CREATE INDEX "order_items_delivered_at_idx" ON "order_items"("delivered_at");

-- CreateIndex
CREATE INDEX "order_items_creator_id_order_status_idx" ON "order_items"("creator_id", "order_status");

-- CreateIndex
CREATE INDEX "order_items_creator_id_delivered_at_idx" ON "order_items"("creator_id", "delivered_at");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "Creator"("creator_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "Creator"("creator_id") ON DELETE RESTRICT ON UPDATE CASCADE;
