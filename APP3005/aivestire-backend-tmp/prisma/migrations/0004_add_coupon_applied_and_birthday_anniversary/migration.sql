-- ============================================================
-- Migration: 0004_add_coupon_applied_and_birthday_anniversary
-- Description: Adds applied coupon code to carts and birthday/anniversary scope types.
-- ============================================================

-- Add applied_coupon_code to both cart types
ALTER TABLE "carts" ADD COLUMN "applied_coupon_code" TEXT;
ALTER TABLE "guest_carts" ADD COLUMN "applied_coupon_code" TEXT;

-- Extend CouponScopeType enum
ALTER TYPE "CouponScopeType" ADD VALUE 'USER_BIRTHDAY';
ALTER TYPE "CouponScopeType" ADD VALUE 'COMPANY_ANNIVERSARY';

-- Add anniversary date column to coupon_scopes
ALTER TABLE "coupon_scopes" ADD COLUMN "company_anniversary_date" TIMESTAMP(3);
