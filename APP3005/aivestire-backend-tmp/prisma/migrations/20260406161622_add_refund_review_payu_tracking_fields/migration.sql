-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RefundStatus" ADD VALUE 'PENDING_REVIEW';
ALTER TYPE "RefundStatus" ADD VALUE 'ARCHIVED';

-- AlterTable
ALTER TABLE "order_refunds" ADD COLUMN     "archived_at" TIMESTAMP(3),
ADD COLUMN     "archived_by" UUID,
ADD COLUMN     "payu_refund_id" TEXT,
ADD COLUMN     "payu_response" JSONB,
ADD COLUMN     "review_notes" TEXT,
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "reviewed_by" UUID;
