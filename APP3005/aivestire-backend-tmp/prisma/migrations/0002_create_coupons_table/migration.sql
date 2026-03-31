-- ============================================================
-- Migration: 0002_create_coupons_table
-- Description: Creates the coupon system tables and enums.
-- ============================================================

-- Enums
CREATE TYPE "CouponType" AS ENUM ('FLAT', 'PERCENTAGE', 'DELIVERY');
CREATE TYPE "CouponStatus" AS ENUM ('ACTIVE', 'DISABLED', 'EXPIRED');

-- Coupons table
CREATE TABLE "coupons" (
    "coupon_id"            UUID NOT NULL DEFAULT gen_random_uuid(),
    "title"                TEXT NOT NULL,
    "code"                 TEXT NOT NULL,
    "description"          TEXT,
    "discount_type"        "CouponType" NOT NULL,
    "discount_value"       DECIMAL(10,2) NOT NULL,
    "min_order_amount"     DECIMAL(10,2) NOT NULL DEFAULT 0,
    "max_usage"            INTEGER NOT NULL DEFAULT 1,
    "current_usage"        INTEGER NOT NULL DEFAULT 0,
    "status"               "CouponStatus" NOT NULL DEFAULT 'ACTIVE',
    "reason"               TEXT,
    "terms_and_conditions" TEXT,
    "start_date"           TIMESTAMP(3) NOT NULL,
    "end_date"             TIMESTAMP(3) NOT NULL,
    "created_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"           TIMESTAMP(3) NOT NULL,
    "is_location_restricted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("coupon_id")
);

CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");
CREATE INDEX "coupons_status_idx" ON "coupons"("status");
CREATE INDEX "coupons_code_idx" ON "coupons"("code");
CREATE INDEX "coupons_reason_idx" ON "coupons"("reason");
CREATE INDEX "coupons_start_date_idx" ON "coupons"("start_date");
CREATE INDEX "coupons_end_date_idx" ON "coupons"("end_date");

-- Coupon location restrictions
CREATE TABLE "coupon_allowed_pincodes" (
    "id"        UUID NOT NULL DEFAULT gen_random_uuid(),
    "coupon_id" UUID NOT NULL,
    "pincode"   TEXT NOT NULL,

    CONSTRAINT "coupon_allowed_pincodes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coupon_allowed_pincodes_coupon_id_pincode_key" ON "coupon_allowed_pincodes"("coupon_id", "pincode");
CREATE INDEX "coupon_allowed_pincodes_coupon_id_idx" ON "coupon_allowed_pincodes"("coupon_id");
CREATE INDEX "coupon_allowed_pincodes_pincode_idx" ON "coupon_allowed_pincodes"("pincode");

-- Foreign keys
ALTER TABLE "coupon_allowed_pincodes" ADD CONSTRAINT "coupon_allowed_pincodes_coupon_id_fkey"
    FOREIGN KEY ("coupon_id") REFERENCES "coupons"("coupon_id") ON DELETE CASCADE ON UPDATE CASCADE;
