-- ============================================================
-- Migration: 0009_add_commission_percentage_to_product
-- Description: Adds commission_percentage column to Product.
--   Existing rows default to 10 (10%).
-- ============================================================

ALTER TABLE "Product"
    ADD COLUMN "commission_percentage" INTEGER NOT NULL DEFAULT 10;
