-- ============================================
-- ROLLBACK MIGRATION: Remove Refund, Return, Replacement System
-- Date: 2026-02-15
-- Description: Reverts all RRR system changes
-- WARNING: This will delete all refund, return, and replacement data!
-- ============================================

-- ============================================
-- STEP 1: Drop Foreign Key Constraints First
-- ============================================

ALTER TABLE "order_replacements" DROP CONSTRAINT IF EXISTS "order_replacements_new_order_id_fkey";
ALTER TABLE "order_replacements" DROP CONSTRAINT IF EXISTS "order_replacements_original_order_id_fkey";
ALTER TABLE "order_returns" DROP CONSTRAINT IF EXISTS "order_returns_order_id_fkey";
ALTER TABLE "order_refunds" DROP CONSTRAINT IF EXISTS "order_refunds_order_id_fkey";

-- ============================================
-- STEP 2: Drop Tables
-- ============================================

DROP TABLE IF EXISTS "order_replacements";
DROP TABLE IF EXISTS "order_returns";
DROP TABLE IF EXISTS "order_refunds";

-- ============================================
-- STEP 3: Remove Columns from Orders Table
-- ============================================

ALTER TABLE "orders" DROP COLUMN IF EXISTS "replace_requested_at";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "replace_status";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "return_requested_at";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "return_status";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "refund_amount";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "refund_status";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "cancel_feedback";

-- ============================================
-- STEP 4: Drop Enums
-- ============================================

DROP TYPE IF EXISTS "ReplacementStatus";
DROP TYPE IF EXISTS "ReplaceReason";
DROP TYPE IF EXISTS "ReturnStatus";
DROP TYPE IF EXISTS "ReturnReason";
DROP TYPE IF EXISTS "RefundStatus";

-- ============================================
-- ROLLBACK COMPLETE
-- ============================================

-- All RRR system changes have been reverted.
-- The database is now in its pre-RRR state.
