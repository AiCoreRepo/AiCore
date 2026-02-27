/*
  Warnings:

  - The values [COLOR_DIFFERENCE,NOT_AS_DESCRIBED] on the enum `ReplaceReason` will be removed. If these variants are still used in the database, this will fail.
  - The values [COLOR_DIFFERENCE] on the enum `ReturnReason` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `date_of_birth` on the `User` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReplaceReason_new" AS ENUM ('DAMAGED', 'WRONG_ITEM', 'SIZE_ISSUE', 'DEFECTIVE', 'QUALITY_ISSUE', 'OTHER');
ALTER TABLE "order_replacements" ALTER COLUMN "replace_reason" TYPE "ReplaceReason_new" USING ("replace_reason"::text::"ReplaceReason_new");
ALTER TYPE "ReplaceReason" RENAME TO "ReplaceReason_old";
ALTER TYPE "ReplaceReason_new" RENAME TO "ReplaceReason";
DROP TYPE "public"."ReplaceReason_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ReturnReason_new" AS ENUM ('DAMAGED', 'WRONG_ITEM', 'SIZE_ISSUE', 'QUALITY_ISSUE', 'NOT_AS_DESCRIBED', 'DEFECTIVE', 'CHANGED_MIND', 'OTHER');
ALTER TABLE "order_returns" ALTER COLUMN "return_reason" TYPE "ReturnReason_new" USING ("return_reason"::text::"ReturnReason_new");
ALTER TYPE "ReturnReason" RENAME TO "ReturnReason_old";
ALTER TYPE "ReturnReason_new" RENAME TO "ReturnReason";
DROP TYPE "public"."ReturnReason_old";
COMMIT;

-- AlterEnum
ALTER TYPE "ReturnStatus" ADD VALUE 'QC_IN_PROGRESS';

-- DropForeignKey
ALTER TABLE "order_replacements" DROP CONSTRAINT "order_replacements_new_order_id_fkey";

-- DropIndex
DROP INDEX "user_addresses_is_default_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "date_of_birth";

-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "is_location_restricted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "order_returns" ADD COLUMN     "refund_id" UUID;

-- AlterTable
ALTER TABLE "payment_transactions" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "wishlist_items_product_id_idx" ON "wishlist_items"("product_id");

-- CreateIndex
CREATE INDEX "wishlists_user_id_idx" ON "wishlists"("user_id");
