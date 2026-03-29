-- ============================================================
-- Migration: 0009_switch_razorpay_to_payu_and_creator_upload
-- Description:
--   Part A: Replaces Razorpay with PayU as payment gateway.
--   Part B: Creates the creator upload hierarchy
--           (Product → Pattern → Color Variant → Image).
--   Part C: Creates creator coupons system.
-- ============================================================

-- ════════════════════════════════════════════════
-- PART A: Switch Razorpay → PayU
-- ════════════════════════════════════════════════

-- Step 3: Migrate existing data (RAZORPAY → PAYU)
UPDATE "payment_transactions"
    SET "gateway" = 'PAYU'
    WHERE "gateway" = 'RAZORPAY';

UPDATE "orders"
    SET "payment_method" = 'PAYU'
    WHERE "payment_method" = 'RAZORPAY';

-- Step 4: Change default on payment_transactions.gateway
ALTER TABLE "payment_transactions"
    ALTER COLUMN "gateway" SET DEFAULT 'PAYU';

-- ════════════════════════════════════════════════
-- PART B: Creator Upload Hierarchy
-- Product → Pattern (Body Shape) → Color Variant (Skin Tone + Stock + Images)
-- ════════════════════════════════════════════════

-- Enums (safe create with exception handling)
DO $$ BEGIN
    CREATE TYPE "BodyShape" AS ENUM (
        'HOURGLASS', 'PEAR', 'APPLE', 'RECTANGLE',
        'INVERTED_TRIANGLE', 'OVAL', 'ATHLETIC', 'PETITE', 'PLUS_SIZE'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SkinTone" AS ENUM (
        'FAIR', 'LIGHT', 'MEDIUM', 'OLIVE',
        'TAN', 'BROWN', 'DARK_BROWN', 'DEEP'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ClothingColor" AS ENUM (
        'BLACK', 'WHITE', 'GREY', 'CHARCOAL',
        'NAVY', 'ROYAL_BLUE', 'SKY_BLUE', 'TEAL',
        'GREEN', 'OLIVE_GREEN', 'MINT',
        'RED', 'MAROON', 'PINK', 'HOT_PINK', 'CORAL',
        'ORANGE', 'YELLOW', 'GOLD',
        'BEIGE', 'CREAM', 'BROWN', 'CHOCOLATE', 'CARAMEL',
        'LAVENDER', 'PURPLE', 'INDIGO',
        'RUST', 'OFF_WHITE', 'MULTI_COLOR', 'PRINTED', 'OTHER'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Product Patterns
CREATE TABLE "product_patterns" (
    "pattern_id"    UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id"    UUID NOT NULL,
    "name"          TEXT NOT NULL,
    "body_shapes"   "BodyShape"[],
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_patterns_pkey" PRIMARY KEY ("pattern_id")
);
CREATE INDEX "product_patterns_product_id_idx" ON "product_patterns"("product_id");

-- Product Color Variants
CREATE TABLE "product_color_variants" (
    "variant_id"    UUID NOT NULL DEFAULT gen_random_uuid(),
    "pattern_id"    UUID NOT NULL,
    "color"         "ClothingColor" NOT NULL,
    "hex_code"      TEXT,
    "stock"         INTEGER NOT NULL DEFAULT 0,
    "skin_tones"    "SkinTone"[],
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_color_variants_pkey" PRIMARY KEY ("variant_id")
);
CREATE INDEX "product_color_variants_pattern_id_idx" ON "product_color_variants"("pattern_id");

-- Product Color Variant Images
CREATE TABLE "product_color_variant_images" (
    "image_id"    UUID NOT NULL DEFAULT gen_random_uuid(),
    "variant_id"  UUID NOT NULL,
    "url"         TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_primary"  BOOLEAN NOT NULL DEFAULT false,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_color_variant_images_pkey" PRIMARY KEY ("image_id")
);
CREATE INDEX "product_color_variant_images_variant_id_idx" ON "product_color_variant_images"("variant_id");

-- Foreign Keys for upload hierarchy
ALTER TABLE "product_patterns" ADD CONSTRAINT "product_patterns_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_color_variants" ADD CONSTRAINT "product_color_variants_pattern_id_fkey"
    FOREIGN KEY ("pattern_id") REFERENCES "product_patterns"("pattern_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_color_variant_images" ADD CONSTRAINT "product_color_variant_images_variant_id_fkey"
    FOREIGN KEY ("variant_id") REFERENCES "product_color_variants"("variant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ════════════════════════════════════════════════
-- PART C: Creator Coupons
-- ════════════════════════════════════════════════

DO $$ BEGIN
    CREATE TYPE "CouponApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE "creator_coupons" (
    "creator_coupon_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title"             TEXT NOT NULL,
    "code"              TEXT NOT NULL,
    "description"       TEXT,
    "discount_type"     "CouponType" NOT NULL,
    "discount_value"    DECIMAL(10,2) NOT NULL,
    "min_order_amount"  DECIMAL(10,2) NOT NULL DEFAULT 0,
    "max_usage"         INTEGER NOT NULL DEFAULT 1,
    "current_usage"     INTEGER NOT NULL DEFAULT 0,
    "status"            "CouponStatus" NOT NULL DEFAULT 'ACTIVE',
    "approval_status"   "CouponApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approval_note"     TEXT,
    "start_date"        TIMESTAMP(3) NOT NULL,
    "end_date"          TIMESTAMP(3) NOT NULL,
    "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        TIMESTAMP(3) NOT NULL,
    "is_deleted"        BOOLEAN NOT NULL DEFAULT false,
    "creator_id"        UUID NOT NULL,
    "product_id"        UUID NOT NULL,

    CONSTRAINT "creator_coupons_pkey" PRIMARY KEY ("creator_coupon_id")
);

CREATE UNIQUE INDEX "creator_coupons_code_key" ON "creator_coupons"("code");
CREATE INDEX "creator_coupons_status_idx" ON "creator_coupons"("status");
CREATE INDEX "creator_coupons_code_idx" ON "creator_coupons"("code");
CREATE INDEX "creator_coupons_start_date_idx" ON "creator_coupons"("start_date");
CREATE INDEX "creator_coupons_end_date_idx" ON "creator_coupons"("end_date");
CREATE INDEX "creator_coupons_is_deleted_idx" ON "creator_coupons"("is_deleted");
CREATE INDEX "creator_coupons_creator_id_idx" ON "creator_coupons"("creator_id");
CREATE INDEX "creator_coupons_product_id_idx" ON "creator_coupons"("product_id");
CREATE INDEX "creator_coupons_approval_status_idx" ON "creator_coupons"("approval_status");

ALTER TABLE "creator_coupons" ADD CONSTRAINT "creator_coupons_creator_id_fkey"
    FOREIGN KEY ("creator_id") REFERENCES "Creator"("creator_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_coupons" ADD CONSTRAINT "creator_coupons_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;
