-- CreateEnum: CouponScopeType
CREATE TYPE "CouponScopeType" AS ENUM ('GLOBAL', 'PRICE_LEVEL', 'FESTIVAL', 'USER', 'COMPANY_SPECIAL', 'COLLECTION');

-- AlterTable: Add production flags to coupons
ALTER TABLE "coupons" ADD COLUMN "is_one_time_per_user" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "coupons" ADD COLUMN "is_stackable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "coupons" ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: coupon_scopes
CREATE TABLE "coupon_scopes" (
    "scope_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "coupon_id" UUID NOT NULL,
    "scope_type" "CouponScopeType" NOT NULL DEFAULT 'GLOBAL',
    "min_price" DECIMAL(10,2),
    "max_price" DECIMAL(10,2),
    "festival_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupon_scopes_pkey" PRIMARY KEY ("scope_id")
);

-- CreateIndex: coupon_scopes
CREATE UNIQUE INDEX "coupon_scopes_coupon_id_key" ON "coupon_scopes"("coupon_id");
CREATE INDEX "coupon_scopes_scope_type_idx" ON "coupon_scopes"("scope_type");
CREATE INDEX "coupon_scopes_coupon_id_idx" ON "coupon_scopes"("coupon_id");

-- CreateIndex: coupons.is_deleted
CREATE INDEX "coupons_is_deleted_idx" ON "coupons"("is_deleted");

-- AddForeignKey: coupon_scopes -> coupons
ALTER TABLE "coupon_scopes" ADD CONSTRAINT "coupon_scopes_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("coupon_id") ON DELETE CASCADE ON UPDATE CASCADE;
