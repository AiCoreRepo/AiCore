-- Add new CouponScopeType enum values
ALTER TYPE "CouponScopeType" ADD VALUE 'USER_BIRTHDAY';
ALTER TYPE "CouponScopeType" ADD VALUE 'COMPANY_ANNIVERSARY';

-- Add company_anniversary_date to coupon_scopes
ALTER TABLE "coupon_scopes" ADD COLUMN "company_anniversary_date" TIMESTAMP(3);
