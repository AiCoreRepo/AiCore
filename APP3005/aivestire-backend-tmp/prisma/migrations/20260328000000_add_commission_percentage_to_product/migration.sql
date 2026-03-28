-- Migration: Add commission_percentage to Product table
-- Date: 2026-03-28
-- Description: Adds commission_percentage (Int, default 10) to the products table.
--              Existing rows will default to 10 (10%) so no data is lost.

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "commission_percentage" INTEGER NOT NULL DEFAULT 10;

-- Verify column was added successfully (informational comment only):
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'products' AND column_name = 'commission_percentage';
