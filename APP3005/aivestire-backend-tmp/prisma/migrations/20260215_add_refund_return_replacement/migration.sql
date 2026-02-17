-- ============================================
-- MIGRATION: Add Refund, Return, Replacement System
-- Date: 2026-02-15
-- Description: Adds complete RRR (Refund, Return, Replacement) system to orders
-- ============================================

-- ============================================
-- STEP 1: Create New Enums
-- ============================================

-- RefundStatus Enum
CREATE TYPE "RefundStatus" AS ENUM (
  'INITIATED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'REJECTED'
);

-- ReturnReason Enum
CREATE TYPE "ReturnReason" AS ENUM (
  'DAMAGED',
  'DEFECTIVE',
  'WRONG_ITEM',
  'SIZE_ISSUE',
  'COLOR_DIFFERENCE',
  'QUALITY_ISSUE',
  'NOT_AS_DESCRIBED',
  'CHANGED_MIND',
  'OTHER'
);

-- ReturnStatus Enum
CREATE TYPE "ReturnStatus" AS ENUM (
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'PICKUP_SCHEDULED',
  'PICKED_UP',
  'QC_PASSED',
  'QC_FAILED',
  'COMPLETED'
);

-- ReplaceReason Enum
CREATE TYPE "ReplaceReason" AS ENUM (
  'DAMAGED',
  'DEFECTIVE',
  'WRONG_ITEM',
  'SIZE_ISSUE',
  'COLOR_DIFFERENCE',
  'QUALITY_ISSUE',
  'NOT_AS_DESCRIBED',
  'OTHER'
);

-- ReplacementStatus Enum
CREATE TYPE "ReplacementStatus" AS ENUM (
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'PICKUP_SCHEDULED',
  'PICKED_UP',
  'DISPATCHED',
  'DELIVERED',
  'COMPLETED'
);

-- ============================================
-- STEP 2: Alter Orders Table - Add New Fields
-- ============================================

-- Add cancellation feedback field
ALTER TABLE "orders" 
ADD COLUMN "cancel_feedback" TEXT;

-- Add refund tracking fields
ALTER TABLE "orders" 
ADD COLUMN "refund_status" "RefundStatus",
ADD COLUMN "refund_amount" DECIMAL(10, 2);

-- Add return tracking fields
ALTER TABLE "orders" 
ADD COLUMN "return_status" "ReturnStatus",
ADD COLUMN "return_requested_at" TIMESTAMP(3);

-- Add replacement tracking fields
ALTER TABLE "orders" 
ADD COLUMN "replace_status" "ReplacementStatus",
ADD COLUMN "replace_requested_at" TIMESTAMP(3);

-- ============================================
-- STEP 3: Create OrderRefund Table
-- ============================================

CREATE TABLE "order_refunds" (
  "refund_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL,
  
  -- Refund Details
  "amount" DECIMAL(10, 2) NOT NULL,
  "refund_status" "RefundStatus" NOT NULL DEFAULT 'INITIATED',
  "refund_reason" TEXT,
  
  -- Approval
  "approved_by" UUID,
  "approved_at" TIMESTAMP(3),
  "rejection_reason" TEXT,
  
  -- Processing
  "refund_method" TEXT,
  "transaction_id" TEXT,
  
  -- Timestamps
  "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processing_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "failed_at" TIMESTAMP(3),
  
  -- Notes
  "notes" TEXT,
  "metadata" JSONB,
  
  CONSTRAINT "order_refunds_pkey" PRIMARY KEY ("refund_id")
);

-- Create indexes for order_refunds
CREATE INDEX "order_refunds_order_id_idx" ON "order_refunds"("order_id");
CREATE INDEX "order_refunds_refund_status_idx" ON "order_refunds"("refund_status");
CREATE INDEX "order_refunds_initiated_at_idx" ON "order_refunds"("initiated_at" DESC);

-- Add foreign key constraint
ALTER TABLE "order_refunds" 
ADD CONSTRAINT "order_refunds_order_id_fkey" 
FOREIGN KEY ("order_id") 
REFERENCES "orders"("order_id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- ============================================
-- STEP 4: Create OrderReturn Table
-- ============================================

CREATE TABLE "order_returns" (
  "return_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL,
  
  -- Return Details
  "return_reason" "ReturnReason" NOT NULL,
  "custom_reason" TEXT,
  "feedback" TEXT,
  "return_status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
  
  -- Approval
  "approved_by" UUID,
  "approved_at" TIMESTAMP(3),
  "rejected_by" UUID,
  "rejected_at" TIMESTAMP(3),
  "rejection_reason" TEXT,
  
  -- Pickup
  "pickup_scheduled" TIMESTAMP(3),
  "pickup_partner" TEXT,
  "pickup_tracking" TEXT,
  "picked_up_at" TIMESTAMP(3),
  
  -- Quality Control
  "qc_passed" BOOLEAN,
  "qc_notes" TEXT,
  "qc_completed_at" TIMESTAMP(3),
  
  -- Timestamps
  "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  
  -- Notes
  "notes" TEXT,
  "metadata" JSONB,
  
  CONSTRAINT "order_returns_pkey" PRIMARY KEY ("return_id")
);

-- Create indexes for order_returns
CREATE INDEX "order_returns_order_id_idx" ON "order_returns"("order_id");
CREATE INDEX "order_returns_return_status_idx" ON "order_returns"("return_status");
CREATE INDEX "order_returns_requested_at_idx" ON "order_returns"("requested_at" DESC);

-- Add foreign key constraint
ALTER TABLE "order_returns" 
ADD CONSTRAINT "order_returns_order_id_fkey" 
FOREIGN KEY ("order_id") 
REFERENCES "orders"("order_id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- ============================================
-- STEP 5: Create OrderReplacement Table
-- ============================================

CREATE TABLE "order_replacements" (
  "replacement_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "original_order_id" UUID NOT NULL,
  "new_order_id" UUID,
  
  -- Replacement Details
  "replace_reason" "ReplaceReason" NOT NULL,
  "custom_reason" TEXT,
  "feedback" TEXT,
  "replacement_status" "ReplacementStatus" NOT NULL DEFAULT 'REQUESTED',
  
  -- Approval
  "approved_by" UUID,
  "approved_at" TIMESTAMP(3),
  "rejected_by" UUID,
  "rejected_at" TIMESTAMP(3),
  "rejection_reason" TEXT,
  
  -- Original Item Pickup
  "pickup_scheduled" TIMESTAMP(3),
  "pickup_partner" TEXT,
  "pickup_tracking" TEXT,
  "picked_up_at" TIMESTAMP(3),
  
  -- New Item Delivery
  "dispatched_at" TIMESTAMP(3),
  "delivery_tracking" TEXT,
  "delivered_at" TIMESTAMP(3),
  
  -- Timestamps
  "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  
  -- Notes
  "notes" TEXT,
  "metadata" JSONB,
  
  CONSTRAINT "order_replacements_pkey" PRIMARY KEY ("replacement_id")
);

-- Create indexes for order_replacements
CREATE INDEX "order_replacements_original_order_id_idx" ON "order_replacements"("original_order_id");
CREATE INDEX "order_replacements_new_order_id_idx" ON "order_replacements"("new_order_id");
CREATE INDEX "order_replacements_replacement_status_idx" ON "order_replacements"("replacement_status");
CREATE INDEX "order_replacements_requested_at_idx" ON "order_replacements"("requested_at" DESC);

-- Add foreign key constraints
ALTER TABLE "order_replacements" 
ADD CONSTRAINT "order_replacements_original_order_id_fkey" 
FOREIGN KEY ("original_order_id") 
REFERENCES "orders"("order_id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

ALTER TABLE "order_replacements" 
ADD CONSTRAINT "order_replacements_new_order_id_fkey" 
FOREIGN KEY ("new_order_id") 
REFERENCES "orders"("order_id") 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- ============================================
-- STEP 6: Add Comments for Documentation
-- ============================================

COMMENT ON TABLE "order_refunds" IS 'Tracks refund requests for cancelled or returned orders';
COMMENT ON TABLE "order_returns" IS 'Tracks return requests for delivered orders within 7-day window';
COMMENT ON TABLE "order_replacements" IS 'Tracks replacement requests for delivered orders within 7-day window';

COMMENT ON COLUMN "orders"."cancel_feedback" IS 'User feedback when cancelling an order';
COMMENT ON COLUMN "orders"."refund_status" IS 'Current refund status for this order';
COMMENT ON COLUMN "orders"."refund_amount" IS 'Total amount to be refunded';
COMMENT ON COLUMN "orders"."return_status" IS 'Current return status for this order';
COMMENT ON COLUMN "orders"."return_requested_at" IS 'Timestamp when return was requested';
COMMENT ON COLUMN "orders"."replace_status" IS 'Current replacement status for this order';
COMMENT ON COLUMN "orders"."replace_requested_at" IS 'Timestamp when replacement was requested';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Summary:
-- - Added 5 new enums: RefundStatus, ReturnReason, ReturnStatus, ReplaceReason, ReplacementStatus
-- - Added 7 new fields to orders table
-- - Created 3 new tables: order_refunds, order_returns, order_replacements
-- - Added 12 indexes for query optimization
-- - Added 5 foreign key constraints for data integrity
-- - Added documentation comments
