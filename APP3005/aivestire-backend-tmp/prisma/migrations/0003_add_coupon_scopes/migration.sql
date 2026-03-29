-- ============================================================
-- Migration: 0003_add_coupon_scopes
-- Description: Adds coupon scope system and production flags.
-- ============================================================

-- Enum
CREATE TYPE "CouponScopeType" AS ENUM ('GLOBAL', 'PRICE_LEVEL', 'FESTIVAL', 'USER', 'COMPANY_SPECIAL', 'COLLECTION');

-- Production flags on coupons table
ALTER TABLE "coupons" ADD COLUMN "is_one_time_per_user" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "coupons" ADD COLUMN "is_stackable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "coupons" ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- Coupon scopes table
CREATE TABLE "coupon_scopes" (
    "scope_id"     UUID NOT NULL DEFAULT gen_random_uuid(),
    "coupon_id"    UUID NOT NULL,
    "scope_type"   "CouponScopeType" NOT NULL DEFAULT 'GLOBAL',
    "min_price"    DECIMAL(10,2),
    "max_price"    DECIMAL(10,2),
    "festival_key" TEXT,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupon_scopes_pkey" PRIMARY KEY ("scope_id")
);

CREATE UNIQUE INDEX "coupon_scopes_coupon_id_key" ON "coupon_scopes"("coupon_id");
CREATE INDEX "coupon_scopes_scope_type_idx" ON "coupon_scopes"("scope_type");
CREATE INDEX "coupon_scopes_coupon_id_idx" ON "coupon_scopes"("coupon_id");
CREATE INDEX "coupons_is_deleted_idx" ON "coupons"("is_deleted");

-- Foreign key
ALTER TABLE "coupon_scopes" ADD CONSTRAINT "coupon_scopes_coupon_id_fkey"
    FOREIGN KEY ("coupon_id") REFERENCES "coupons"("coupon_id") ON DELETE CASCADE ON UPDATE CASCADE;
