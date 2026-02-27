-- ============================================
-- Migration: add_coupon_system
-- Date: 2026-02-26
-- Description: Creates Coupon System with 
--   coupons table and coupon_allowed_pincodes table
-- ============================================

-- Step 1: Create Enums
DO $$ BEGIN
    CREATE TYPE "CouponType" AS ENUM ('FLAT', 'PERCENTAGE', 'DELIVERY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CouponStatus" AS ENUM ('ACTIVE', 'DISABLED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create coupons table
CREATE TABLE IF NOT EXISTS "coupons" (
    "coupon_id"            UUID            NOT NULL DEFAULT gen_random_uuid(),
    "title"                TEXT            NOT NULL,
    "code"                 TEXT            NOT NULL,
    "description"          TEXT,

    -- Discount
    "discount_type"        "CouponType"    NOT NULL,
    "discount_value"       DECIMAL(10, 2)  NOT NULL,
    "min_order_amount"     DECIMAL(10, 2)  NOT NULL DEFAULT 0,

    -- Usage
    "max_usage"            INTEGER         NOT NULL DEFAULT 1,
    "current_usage"        INTEGER         NOT NULL DEFAULT 0,

    -- Status & Reason
    "status"               "CouponStatus"  NOT NULL DEFAULT 'ACTIVE',
    "reason"               TEXT,

    -- Terms
    "terms_and_conditions" TEXT,

    -- Validity
    "start_date"           TIMESTAMP(3)    NOT NULL,
    "end_date"             TIMESTAMP(3)    NOT NULL,

    -- Timestamps
    "created_at"           TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"           TIMESTAMP(3)    NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("coupon_id")
);

-- Step 3: Create coupon_allowed_pincodes table
CREATE TABLE IF NOT EXISTS "coupon_allowed_pincodes" (
    "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "coupon_id"   UUID NOT NULL,
    "pincode"     TEXT NOT NULL,

    CONSTRAINT "coupon_allowed_pincodes_pkey" PRIMARY KEY ("id")
);

-- Step 4: Create unique constraint and indexes
CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_key" ON "coupons"("code");
CREATE INDEX IF NOT EXISTS "coupons_status_idx" ON "coupons"("status");
CREATE INDEX IF NOT EXISTS "coupons_code_idx" ON "coupons"("code");
CREATE INDEX IF NOT EXISTS "coupons_reason_idx" ON "coupons"("reason");
CREATE INDEX IF NOT EXISTS "coupons_start_date_idx" ON "coupons"("start_date");
CREATE INDEX IF NOT EXISTS "coupons_end_date_idx" ON "coupons"("end_date");

CREATE UNIQUE INDEX IF NOT EXISTS "coupon_allowed_pincodes_coupon_id_pincode_key" ON "coupon_allowed_pincodes"("coupon_id", "pincode");
CREATE INDEX IF NOT EXISTS "coupon_allowed_pincodes_coupon_id_idx" ON "coupon_allowed_pincodes"("coupon_id");
CREATE INDEX IF NOT EXISTS "coupon_allowed_pincodes_pincode_idx" ON "coupon_allowed_pincodes"("pincode");

-- Step 5: Add foreign key
DO $$ BEGIN
    ALTER TABLE "coupon_allowed_pincodes"
    ADD CONSTRAINT "coupon_allowed_pincodes_coupon_id_fkey"
    FOREIGN KEY ("coupon_id")
    REFERENCES "coupons"("coupon_id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
