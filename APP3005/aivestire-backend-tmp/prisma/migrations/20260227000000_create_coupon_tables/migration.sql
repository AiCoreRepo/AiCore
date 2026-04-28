-- Backfill the coupon baseline objects that were introduced outside Prisma Migrate.

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'CouponType'
    ) THEN
        CREATE TYPE "CouponType" AS ENUM ('FLAT', 'PERCENTAGE', 'DELIVERY');
    END IF;
END
$$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'CouponStatus'
    ) THEN
        CREATE TYPE "CouponStatus" AS ENUM ('ACTIVE', 'DISABLED', 'EXPIRED');
    END IF;
END
$$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'CouponApprovalStatus'
    ) THEN
        CREATE TYPE "CouponApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');
    END IF;
END
$$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "coupons" (
    "coupon_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discount_type" "CouponType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "min_order_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "max_usage" INTEGER NOT NULL DEFAULT 1,
    "current_usage" INTEGER NOT NULL DEFAULT 0,
    "status" "CouponStatus" NOT NULL DEFAULT 'ACTIVE',
    "reason" TEXT,
    "terms_and_conditions" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_location_restricted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("coupon_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "coupon_allowed_pincodes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "coupon_id" UUID NOT NULL,
    "pincode" TEXT NOT NULL,

    CONSTRAINT "coupon_allowed_pincodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "creator_coupons" (
    "creator_coupon_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discount_type" "CouponType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "min_order_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "max_usage" INTEGER NOT NULL DEFAULT 1,
    "current_usage" INTEGER NOT NULL DEFAULT 0,
    "status" "CouponStatus" NOT NULL DEFAULT 'ACTIVE',
    "approval_status" "CouponApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approval_note" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "creator_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,

    CONSTRAINT "creator_coupons_pkey" PRIMARY KEY ("creator_coupon_id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "coupons_status_idx" ON "coupons"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "coupons_code_idx" ON "coupons"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "coupons_reason_idx" ON "coupons"("reason");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "coupons_start_date_idx" ON "coupons"("start_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "coupons_end_date_idx" ON "coupons"("end_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "coupon_allowed_pincodes_coupon_id_idx" ON "coupon_allowed_pincodes"("coupon_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "coupon_allowed_pincodes_pincode_idx" ON "coupon_allowed_pincodes"("pincode");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "coupon_allowed_pincodes_coupon_id_pincode_key" ON "coupon_allowed_pincodes"("coupon_id", "pincode");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "creator_coupons_code_key" ON "creator_coupons"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "creator_coupons_status_idx" ON "creator_coupons"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "creator_coupons_code_idx" ON "creator_coupons"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "creator_coupons_start_date_idx" ON "creator_coupons"("start_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "creator_coupons_end_date_idx" ON "creator_coupons"("end_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "creator_coupons_is_deleted_idx" ON "creator_coupons"("is_deleted");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "creator_coupons_creator_id_idx" ON "creator_coupons"("creator_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "creator_coupons_product_id_idx" ON "creator_coupons"("product_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "creator_coupons_approval_status_idx" ON "creator_coupons"("approval_status");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'coupon_allowed_pincodes_coupon_id_fkey'
    ) THEN
        ALTER TABLE "coupon_allowed_pincodes"
        ADD CONSTRAINT "coupon_allowed_pincodes_coupon_id_fkey"
        FOREIGN KEY ("coupon_id")
        REFERENCES "coupons"("coupon_id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END
$$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'creator_coupons_creator_id_fkey'
    ) THEN
        ALTER TABLE "creator_coupons"
        ADD CONSTRAINT "creator_coupons_creator_id_fkey"
        FOREIGN KEY ("creator_id")
        REFERENCES "Creator"("creator_id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END
$$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'creator_coupons_product_id_fkey'
    ) THEN
        ALTER TABLE "creator_coupons"
        ADD CONSTRAINT "creator_coupons_product_id_fkey"
        FOREIGN KEY ("product_id")
        REFERENCES "Product"("product_id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END
$$;
