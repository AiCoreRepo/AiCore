/*
  Warnings:

  - The values [COMPLETED] on the enum `PayoutStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "PayoutType" AS ENUM ('FULL', 'PARTIAL');

-- AlterEnum
BEGIN;
CREATE TYPE "PayoutStatus_new" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED');
ALTER TABLE "public"."payouts" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "payouts" ALTER COLUMN "status" TYPE "PayoutStatus_new" USING ("status"::text::"PayoutStatus_new");
ALTER TYPE "PayoutStatus" RENAME TO "PayoutStatus_old";
ALTER TYPE "PayoutStatus_new" RENAME TO "PayoutStatus";
DROP TYPE "public"."PayoutStatus_old";
ALTER TABLE "payouts" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "payouts" ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "failed_at" TIMESTAMP(3),
ADD COLUMN     "failure_reason" TEXT,
ADD COLUMN     "gateway_status" TEXT,
ADD COLUMN     "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "payment_gateway" TEXT NOT NULL DEFAULT 'PAYU',
ADD COLUMN     "payout_type" "PayoutType" NOT NULL DEFAULT 'FULL',
ADD COLUMN     "phone_number" TEXT,
ADD COLUMN     "processed_by_admin" UUID,
ADD COLUMN     "transaction_id" TEXT,
ADD COLUMN     "upi_id" TEXT;

-- CreateIndex
CREATE INDEX "payouts_transaction_id_idx" ON "payouts"("transaction_id");
