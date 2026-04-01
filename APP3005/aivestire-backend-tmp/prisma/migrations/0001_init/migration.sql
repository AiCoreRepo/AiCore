-- ============================================================
-- Migration: 0001_init (Consolidated Baseline)
-- Description: Creates all tables, enums, indexes, and foreign
--   keys representing the production database state.
--   This consolidates 27 previously-applied migrations.
-- ============================================================

-- ────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────

CREATE TYPE "AuraStatus" AS ENUM ('PENDING', 'READY', 'ERROR');
CREATE TYPE "UserRole" AS ENUM ('BUYER', 'CREATOR', 'ADMIN');
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');
CREATE TYPE "TryOnPermissionStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "AddressType" AS ENUM ('HOME', 'WORK', 'OTHER');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'BOOKED', 'DISPATCHED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('PREPAID', 'COD', 'RAZORPAY');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE "ChangedByType" AS ENUM ('SYSTEM', 'ADMIN', 'DELIVERY_PARTNER', 'USER');
CREATE TYPE "LocationType" AS ENUM ('WAREHOUSE', 'TRANSIT_HUB', 'LOCAL_FACILITY', 'OUT_FOR_DELIVERY', 'DELIVERED');
CREATE TYPE "RefundStatus" AS ENUM ('INITIATED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED');
CREATE TYPE "ReturnReason" AS ENUM ('DAMAGED', 'WRONG_ITEM', 'SIZE_ISSUE', 'QUALITY_ISSUE', 'NOT_AS_DESCRIBED', 'DEFECTIVE', 'CHANGED_MIND', 'OTHER');
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'QC_IN_PROGRESS', 'QC_PASSED', 'QC_FAILED', 'COMPLETED', 'REJECTED');
CREATE TYPE "ReplaceReason" AS ENUM ('DAMAGED', 'WRONG_ITEM', 'SIZE_ISSUE', 'DEFECTIVE', 'QUALITY_ISSUE', 'OTHER');
CREATE TYPE "ReplacementStatus" AS ENUM ('REQUESTED', 'APPROVED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'DISPATCHED', 'DELIVERED', 'COMPLETED', 'REJECTED');
CREATE TYPE "PaymentGateway" AS ENUM ('RAZORPAY', 'COD');
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('CREATED', 'ATTEMPTED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED');

-- ────────────────────────────────────────────────
-- CORE TABLES
-- ────────────────────────────────────────────────

-- User
CREATE TABLE "User" (
    "user_id"                   UUID NOT NULL DEFAULT gen_random_uuid(),
    "email"                     TEXT NOT NULL,
    "password_hash"             TEXT,
    "phone"                     TEXT,
    "phone_verified"            BOOLEAN NOT NULL DEFAULT false,
    "status"                    TEXT NOT NULL DEFAULT 'active',
    "try_on_permission"         "TryOnPermissionStatus" NOT NULL DEFAULT 'NONE',
    "created_at"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login"                TIMESTAMP(3),
    "refresh_token_hash"        TEXT,
    "role"                      "UserRole" NOT NULL DEFAULT 'BUYER',
    "max_try_ons"               INTEGER NOT NULL DEFAULT 3,
    "try_ons_used"              INTEGER NOT NULL DEFAULT 0,
    "has_created_aura"          BOOLEAN NOT NULL DEFAULT false,
    "max_avatar_regenerations"  INTEGER NOT NULL DEFAULT 2,
    "avatar_regenerations_used" INTEGER NOT NULL DEFAULT 0,
    "date_of_birth"             TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Creator
CREATE TABLE "Creator" (
    "creator_id"        UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id"           UUID NOT NULL,
    "store_name"        TEXT NOT NULL,
    "store_slug"        TEXT NOT NULL,
    "about"             TEXT,
    "verified"          BOOLEAN NOT NULL DEFAULT false,
    "verification_data" JSONB,
    "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terms_accepted"    BOOLEAN NOT NULL DEFAULT false,
    "terms_accepted_at" TIMESTAMP(3),
    "terms_version"     TEXT,

    CONSTRAINT "Creator_pkey" PRIMARY KEY ("creator_id")
);
CREATE UNIQUE INDEX "Creator_user_id_key" ON "Creator"("user_id");
CREATE UNIQUE INDEX "Creator_store_slug_key" ON "Creator"("store_slug");

-- CreatorLimit
CREATE TABLE "CreatorLimit" (
    "creator_id"             UUID NOT NULL,
    "max_products"           INTEGER NOT NULL DEFAULT 30,
    "max_images_per_product" INTEGER NOT NULL DEFAULT 20,
    "created_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorLimit_pkey" PRIMARY KEY ("creator_id")
);

-- Product
CREATE TABLE "Product" (
    "product_id"      UUID NOT NULL DEFAULT gen_random_uuid(),
    "creator_id"      UUID NOT NULL,
    "title"           TEXT NOT NULL,
    "slug"            TEXT NOT NULL,
    "description"     TEXT,
    "price_cents"     INTEGER NOT NULL,
    "currency"        TEXT NOT NULL DEFAULT 'INR',
    "inventory_count" INTEGER NOT NULL DEFAULT 0,
    "is_deleted"      BOOLEAN NOT NULL DEFAULT false,
    "max_images"      INTEGER NOT NULL DEFAULT 20,
    "metadata"        JSONB,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3),
    "status"          "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "category"        TEXT,
    "is_featured"     BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("product_id")
);
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- ProductImage
CREATE TABLE "ProductImage" (
    "image_id"    UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id"  UUID NOT NULL,
    "url"         TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_primary"  BOOLEAN NOT NULL DEFAULT false,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("image_id")
);

-- ProductApproval
CREATE TABLE "ProductApproval" (
    "approval_id"   UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id"    UUID NOT NULL,
    "submitted_by"  UUID,
    "admin_user_id" UUID,
    "comment"       TEXT,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actioned_at"   TIMESTAMP(3),
    "status"        "ApprovalStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "ProductApproval_pkey" PRIMARY KEY ("approval_id")
);

-- ApprovalLog
CREATE TABLE "ApprovalLog" (
    "log_id"        UUID NOT NULL DEFAULT gen_random_uuid(),
    "approval_id"   UUID NOT NULL,
    "actor_user_id" UUID,
    "action"        TEXT NOT NULL,
    "comment"       TEXT,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalLog_pkey" PRIMARY KEY ("log_id")
);

-- ProductStat
CREATE TABLE "ProductStat" (
    "product_id"     UUID NOT NULL,
    "views"          INTEGER NOT NULL DEFAULT 0,
    "likes_count"    INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "last_updated"   TIMESTAMP(3),

    CONSTRAINT "ProductStat_pkey" PRIMARY KEY ("product_id")
);

-- ────────────────────────────────────────────────
-- SOCIAL TABLES
-- ────────────────────────────────────────────────

CREATE TABLE "product_likes" (
    "like_id"    UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "user_id"    UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_likes_pkey" PRIMARY KEY ("like_id")
);
CREATE UNIQUE INDEX "product_likes_product_id_user_id_key" ON "product_likes"("product_id", "user_id");

CREATE TABLE "product_comments" (
    "comment_id"   UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id"   UUID NOT NULL,
    "user_id"      UUID NOT NULL,
    "comment_text" TEXT NOT NULL,
    "image_urls"   TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_comments_pkey" PRIMARY KEY ("comment_id")
);

-- ────────────────────────────────────────────────
-- AURA & TRY-ON
-- ────────────────────────────────────────────────

CREATE TABLE "Aura" (
    "aura_id"               UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id"               UUID NOT NULL,
    "image_url"             TEXT,
    "height_cm"             INTEGER,
    "weight_kg"             INTEGER,
    "skin_tone"             TEXT,
    "gender"                TEXT,
    "body_shape"            TEXT,
    "body_type"             TEXT,
    "body_size"             TEXT,
    "age_range"             TEXT,
    "hair_style"            TEXT,
    "beard"                 BOOLEAN,
    "extra_attributes"      JSONB,
    "model_url"             TEXT,
    "generated_avatar_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attributes"            JSONB,
    "status"                "AuraStatus" NOT NULL DEFAULT 'PENDING',
    "created_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"            TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aura_pkey" PRIMARY KEY ("aura_id")
);
CREATE UNIQUE INDEX "Aura_user_id_key" ON "Aura"("user_id");
CREATE INDEX "Aura_status_idx" ON "Aura"("status");

CREATE TABLE "try_ons" (
    "try_on_id"            UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id"              UUID NOT NULL,
    "product_id"           UUID NOT NULL,
    "aura_id"              UUID NOT NULL,
    "result_image_url"     TEXT NOT NULL,
    "created_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider"             TEXT NOT NULL DEFAULT 'unknown',
    "angle"                TEXT,
    "base_tryon_id"        UUID,
    "cloudinary_public_id" TEXT,
    "thumbnail_url"        TEXT,
    "compressed_url"       TEXT,
    "metadata_cache"       JSONB,
    "processing_metrics"   JSONB,
    "angles_generated"     TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "try_ons_pkey" PRIMARY KEY ("try_on_id")
);
CREATE INDEX "try_ons_user_id_idx" ON "try_ons"("user_id");
CREATE INDEX "try_ons_aura_id_product_id_angle_idx" ON "try_ons"("aura_id", "product_id", "angle");
CREATE INDEX "try_ons_cloudinary_public_id_idx" ON "try_ons"("cloudinary_public_id");

-- ────────────────────────────────────────────────
-- OTP VERIFICATION
-- ────────────────────────────────────────────────

CREATE TABLE "otp_verifications" (
    "otp_id"       UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone_number" TEXT NOT NULL,
    "otp_hash"     TEXT NOT NULL,
    "expires_at"   TIMESTAMP(3) NOT NULL,
    "verified"     BOOLEAN NOT NULL DEFAULT false,
    "attempts"     INTEGER NOT NULL DEFAULT 0,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("otp_id")
);
CREATE INDEX "otp_verifications_phone_number_idx" ON "otp_verifications"("phone_number");
CREATE INDEX "otp_verifications_expires_at_idx" ON "otp_verifications"("expires_at");

-- ────────────────────────────────────────────────
-- USER ADDRESSES
-- ────────────────────────────────────────────────

CREATE TABLE "user_addresses" (
    "address_id"    UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id"       UUID NOT NULL,
    "full_name"     TEXT NOT NULL,
    "phone"         TEXT NOT NULL,
    "pincode"       TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "city"          TEXT NOT NULL,
    "state"         TEXT NOT NULL,
    "landmark"      TEXT,
    "address_type"  "AddressType" NOT NULL DEFAULT 'HOME',
    "is_default"    BOOLEAN NOT NULL DEFAULT false,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("address_id")
);
CREATE INDEX "user_addresses_user_id_idx" ON "user_addresses"("user_id");

-- ────────────────────────────────────────────────
-- WISHLIST
-- ────────────────────────────────────────────────

CREATE TABLE "wishlists" (
    "wishlist_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id"     UUID NOT NULL,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("wishlist_id")
);
CREATE UNIQUE INDEX "wishlists_user_id_key" ON "wishlists"("user_id");
CREATE INDEX "wishlists_user_id_idx" ON "wishlists"("user_id");

CREATE TABLE "wishlist_items" (
    "wishlist_item_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wishlist_id"      UUID NOT NULL,
    "product_id"       UUID NOT NULL,
    "added_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("wishlist_item_id")
);
CREATE UNIQUE INDEX "wishlist_items_wishlist_id_product_id_key" ON "wishlist_items"("wishlist_id", "product_id");
CREATE INDEX "wishlist_items_wishlist_id_idx" ON "wishlist_items"("wishlist_id");
CREATE INDEX "wishlist_items_product_id_idx" ON "wishlist_items"("product_id");

-- ────────────────────────────────────────────────
-- CART SYSTEM
-- ────────────────────────────────────────────────

CREATE TABLE "carts" (
    "cart_id"           UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id"           UUID NOT NULL,
    "version"           INTEGER NOT NULL DEFAULT 1,
    "merged_from_guest" BOOLEAN NOT NULL DEFAULT false,
    "region"            TEXT NOT NULL DEFAULT 'IN',
    "channel"           TEXT NOT NULL DEFAULT 'WEB',
    "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("cart_id")
);
CREATE UNIQUE INDEX "carts_user_id_key" ON "carts"("user_id");
CREATE INDEX "carts_user_id_idx" ON "carts"("user_id");

CREATE TABLE "cart_items" (
    "cart_item_id"         UUID NOT NULL DEFAULT gen_random_uuid(),
    "cart_id"              UUID NOT NULL,
    "product_id"           UUID NOT NULL,
    "quantity"             INTEGER NOT NULL DEFAULT 1,
    "size"                 TEXT,
    "color"                TEXT,
    "price_cents_snapshot" INTEGER NOT NULL,
    "currency_snapshot"    TEXT NOT NULL DEFAULT 'INR',
    "added_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"           TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("cart_item_id")
);
CREATE UNIQUE INDEX "cart_items_cart_id_product_id_size_color_key" ON "cart_items"("cart_id", "product_id", "size", "color");
CREATE INDEX "cart_items_cart_id_idx" ON "cart_items"("cart_id");
CREATE INDEX "cart_items_product_id_idx" ON "cart_items"("product_id");

CREATE TABLE "guest_carts" (
    "guest_cart_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id"    TEXT NOT NULL,
    "region"        TEXT NOT NULL DEFAULT 'IN',
    "channel"       TEXT NOT NULL DEFAULT 'WEB',
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL,
    "expires_at"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_carts_pkey" PRIMARY KEY ("guest_cart_id")
);
CREATE UNIQUE INDEX "guest_carts_session_id_key" ON "guest_carts"("session_id");
CREATE INDEX "guest_carts_session_id_idx" ON "guest_carts"("session_id");
CREATE INDEX "guest_carts_expires_at_idx" ON "guest_carts"("expires_at");

CREATE TABLE "guest_cart_items" (
    "guest_cart_item_id"   UUID NOT NULL DEFAULT gen_random_uuid(),
    "guest_cart_id"        UUID NOT NULL,
    "product_id"           UUID NOT NULL,
    "quantity"             INTEGER NOT NULL DEFAULT 1,
    "size"                 TEXT,
    "color"                TEXT,
    "price_cents_snapshot" INTEGER NOT NULL,
    "currency_snapshot"    TEXT NOT NULL DEFAULT 'INR',
    "added_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"           TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_cart_items_pkey" PRIMARY KEY ("guest_cart_item_id")
);
CREATE UNIQUE INDEX "guest_cart_items_guest_cart_id_product_id_size_color_key" ON "guest_cart_items"("guest_cart_id", "product_id", "size", "color");
CREATE INDEX "guest_cart_items_guest_cart_id_idx" ON "guest_cart_items"("guest_cart_id");
CREATE INDEX "guest_cart_items_product_id_idx" ON "guest_cart_items"("product_id");

-- ────────────────────────────────────────────────
-- ORDER MANAGEMENT SYSTEM
-- ────────────────────────────────────────────────

CREATE TABLE "orders" (
    "order_id"                  UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_number"              TEXT NOT NULL,
    "user_id"                   UUID NOT NULL,
    "total_amount"              DECIMAL(10,2) NOT NULL,
    "payment_method"            "PaymentMethod" NOT NULL,
    "payment_status"            "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "current_status"            "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "cod_collected"             BOOLEAN NOT NULL DEFAULT false,
    "cod_collected_at"          TIMESTAMP(3),
    "cod_collected_by"          UUID,
    "shipping_address_id"       UUID NOT NULL,
    "tracking_number"           TEXT,
    "delivery_partner"          TEXT,
    "estimated_delivery_date"   TIMESTAMP(3),
    "cancelled_at"              TIMESTAMP(3),
    "cancelled_by"              UUID,
    "cancellation_reason"       TEXT,
    "cancel_feedback"           TEXT,
    "refund_status"             "RefundStatus",
    "refund_amount"             DECIMAL(10,2),
    "return_status"             "ReturnStatus",
    "return_requested_at"       TIMESTAMP(3),
    "replace_status"            "ReplacementStatus",
    "replace_requested_at"      TIMESTAMP(3),
    "created_at"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id")
);
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");
CREATE INDEX "orders_current_status_idx" ON "orders"("current_status");
CREATE INDEX "orders_order_number_idx" ON "orders"("order_number");
CREATE INDEX "orders_tracking_number_idx" ON "orders"("tracking_number");
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at" DESC);

CREATE TABLE "order_items" (
    "order_item_id"   UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id"        UUID NOT NULL,
    "product_id"      UUID NOT NULL,
    "quantity"        INTEGER NOT NULL,
    "unit_price"      DECIMAL(10,2) NOT NULL,
    "total_price"     DECIMAL(10,2) NOT NULL,
    "product_name"    TEXT NOT NULL,
    "product_image"   TEXT,
    "variant_details" JSONB,
    "size"            TEXT,
    "color"           TEXT,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("order_item_id")
);
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

CREATE TABLE "order_status_history" (
    "history_id"      UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id"        UUID NOT NULL,
    "from_status"     TEXT,
    "to_status"       TEXT NOT NULL,
    "changed_by"      UUID,
    "changed_by_type" "ChangedByType",
    "notes"           TEXT,
    "metadata"        JSONB,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("history_id")
);
CREATE INDEX "order_status_history_order_id_idx" ON "order_status_history"("order_id");
CREATE INDEX "order_status_history_created_at_idx" ON "order_status_history"("created_at" DESC);

CREATE TABLE "delivery_tracking" (
    "tracking_id"              UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id"                 UUID NOT NULL,
    "location_name"            TEXT NOT NULL,
    "location_type"            "LocationType" NOT NULL,
    "latitude"                 DECIMAL(10,8),
    "longitude"                DECIMAL(11,8),
    "status_description"       TEXT NOT NULL,
    "delivery_partner_agent"   TEXT,
    "metadata"                 JSONB,
    "created_at"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_tracking_pkey" PRIMARY KEY ("tracking_id")
);
CREATE INDEX "delivery_tracking_order_id_idx" ON "delivery_tracking"("order_id");
CREATE INDEX "delivery_tracking_created_at_idx" ON "delivery_tracking"("created_at" DESC);

CREATE TABLE "order_refunds" (
    "refund_id"        UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id"         UUID NOT NULL,
    "amount"           DECIMAL(10,2) NOT NULL,
    "refund_status"    "RefundStatus" NOT NULL DEFAULT 'INITIATED',
    "refund_reason"    TEXT,
    "approved_by"      UUID,
    "approved_at"      TIMESTAMP(3),
    "rejection_reason" TEXT,
    "refund_method"    TEXT,
    "transaction_id"   TEXT,
    "initiated_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processing_at"    TIMESTAMP(3),
    "completed_at"     TIMESTAMP(3),
    "failed_at"        TIMESTAMP(3),
    "notes"            TEXT,
    "metadata"         JSONB,

    CONSTRAINT "order_refunds_pkey" PRIMARY KEY ("refund_id")
);
CREATE INDEX "order_refunds_order_id_idx" ON "order_refunds"("order_id");
CREATE INDEX "order_refunds_refund_status_idx" ON "order_refunds"("refund_status");
CREATE INDEX "order_refunds_initiated_at_idx" ON "order_refunds"("initiated_at" DESC);

CREATE TABLE "order_returns" (
    "return_id"        UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id"         UUID NOT NULL,
    "return_reason"    "ReturnReason" NOT NULL,
    "custom_reason"    TEXT,
    "feedback"         TEXT,
    "return_status"    "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "approved_by"      UUID,
    "approved_at"      TIMESTAMP(3),
    "rejected_by"      UUID,
    "rejected_at"      TIMESTAMP(3),
    "rejection_reason" TEXT,
    "pickup_scheduled" TIMESTAMP(3),
    "pickup_partner"   TEXT,
    "pickup_tracking"  TEXT,
    "picked_up_at"     TIMESTAMP(3),
    "qc_passed"        BOOLEAN,
    "qc_notes"         TEXT,
    "qc_completed_at"  TIMESTAMP(3),
    "refund_id"        UUID,
    "requested_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at"     TIMESTAMP(3),
    "notes"            TEXT,
    "metadata"         JSONB,

    CONSTRAINT "order_returns_pkey" PRIMARY KEY ("return_id")
);
CREATE INDEX "order_returns_order_id_idx" ON "order_returns"("order_id");
CREATE INDEX "order_returns_return_status_idx" ON "order_returns"("return_status");
CREATE INDEX "order_returns_requested_at_idx" ON "order_returns"("requested_at" DESC);

CREATE TABLE "order_replacements" (
    "replacement_id"     UUID NOT NULL DEFAULT gen_random_uuid(),
    "original_order_id"  UUID NOT NULL,
    "new_order_id"       UUID,
    "replace_reason"     "ReplaceReason" NOT NULL,
    "custom_reason"      TEXT,
    "feedback"           TEXT,
    "replacement_status" "ReplacementStatus" NOT NULL DEFAULT 'REQUESTED',
    "approved_by"        UUID,
    "approved_at"        TIMESTAMP(3),
    "rejected_by"        UUID,
    "rejected_at"        TIMESTAMP(3),
    "rejection_reason"   TEXT,
    "pickup_scheduled"   TIMESTAMP(3),
    "pickup_partner"     TEXT,
    "pickup_tracking"    TEXT,
    "picked_up_at"       TIMESTAMP(3),
    "dispatched_at"      TIMESTAMP(3),
    "delivery_tracking"  TEXT,
    "delivered_at"       TIMESTAMP(3),
    "requested_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at"       TIMESTAMP(3),
    "notes"              TEXT,
    "metadata"           JSONB,

    CONSTRAINT "order_replacements_pkey" PRIMARY KEY ("replacement_id")
);
CREATE INDEX "order_replacements_original_order_id_idx" ON "order_replacements"("original_order_id");
CREATE INDEX "order_replacements_new_order_id_idx" ON "order_replacements"("new_order_id");
CREATE INDEX "order_replacements_replacement_status_idx" ON "order_replacements"("replacement_status");
CREATE INDEX "order_replacements_requested_at_idx" ON "order_replacements"("requested_at" DESC);

-- ────────────────────────────────────────────────
-- PAYMENT TRANSACTIONS
-- ────────────────────────────────────────────────

CREATE TABLE "payment_transactions" (
    "transaction_id"     UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id"           UUID NOT NULL,
    "gateway"            "PaymentGateway" NOT NULL DEFAULT 'RAZORPAY',
    "gateway_order_id"   TEXT,
    "gateway_payment_id" TEXT,
    "amount_paise"       INTEGER NOT NULL,
    "currency"           TEXT NOT NULL DEFAULT 'INR',
    "receipt"            TEXT,
    "status"             "PaymentTransactionStatus" NOT NULL DEFAULT 'CREATED',
    "payment_method"     TEXT,
    "refund_id"          TEXT,
    "refunded_at"        TIMESTAMP(3),
    "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "captured_at"        TIMESTAMP(3),
    "updated_at"         TIMESTAMP(3) NOT NULL,
    "metadata"           JSONB,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("transaction_id")
);
CREATE UNIQUE INDEX "payment_transactions_gateway_order_id_key" ON "payment_transactions"("gateway_order_id");
CREATE INDEX "payment_transactions_order_id_idx" ON "payment_transactions"("order_id");
CREATE INDEX "payment_transactions_gateway_order_id_idx" ON "payment_transactions"("gateway_order_id");
CREATE INDEX "payment_transactions_gateway_payment_id_idx" ON "payment_transactions"("gateway_payment_id");
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");
CREATE INDEX "payment_transactions_created_at_idx" ON "payment_transactions"("created_at" DESC);

-- ────────────────────────────────────────────────
-- FOREIGN KEYS
-- ────────────────────────────────────────────────

-- Creator → User
ALTER TABLE "Creator" ADD CONSTRAINT "Creator_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreatorLimit → Creator
ALTER TABLE "CreatorLimit" ADD CONSTRAINT "CreatorLimit_creator_id_fkey"
    FOREIGN KEY ("creator_id") REFERENCES "Creator"("creator_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Product → Creator
ALTER TABLE "Product" ADD CONSTRAINT "Product_creator_id_fkey"
    FOREIGN KEY ("creator_id") REFERENCES "Creator"("creator_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ProductImage → Product
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ProductApproval → Product, User (admin + submitter)
ALTER TABLE "ProductApproval" ADD CONSTRAINT "ProductApproval_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductApproval" ADD CONSTRAINT "ProductApproval_submitted_by_fkey"
    FOREIGN KEY ("submitted_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductApproval" ADD CONSTRAINT "ProductApproval_admin_user_id_fkey"
    FOREIGN KEY ("admin_user_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ApprovalLog → ProductApproval
ALTER TABLE "ApprovalLog" ADD CONSTRAINT "ApprovalLog_approval_id_fkey"
    FOREIGN KEY ("approval_id") REFERENCES "ProductApproval"("approval_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ProductStat → Product
ALTER TABLE "ProductStat" ADD CONSTRAINT "ProductStat_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Social → Product, User
ALTER TABLE "product_likes" ADD CONSTRAINT "product_likes_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_likes" ADD CONSTRAINT "product_likes_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_comments" ADD CONSTRAINT "product_comments_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_comments" ADD CONSTRAINT "product_comments_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Aura → User
ALTER TABLE "Aura" ADD CONSTRAINT "Aura_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- TryOn → User, Product, Aura, self-ref
ALTER TABLE "try_ons" ADD CONSTRAINT "try_ons_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "try_ons" ADD CONSTRAINT "try_ons_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "try_ons" ADD CONSTRAINT "try_ons_aura_id_fkey"
    FOREIGN KEY ("aura_id") REFERENCES "Aura"("aura_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "try_ons" ADD CONSTRAINT "try_ons_base_tryon_id_fkey"
    FOREIGN KEY ("base_tryon_id") REFERENCES "try_ons"("try_on_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Address → User
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Wishlist → User, Product
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlist_id_fkey"
    FOREIGN KEY ("wishlist_id") REFERENCES "wishlists"("wishlist_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Cart → User, Product
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey"
    FOREIGN KEY ("cart_id") REFERENCES "carts"("cart_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Guest Cart → Product
ALTER TABLE "guest_cart_items" ADD CONSTRAINT "guest_cart_items_guest_cart_id_fkey"
    FOREIGN KEY ("guest_cart_id") REFERENCES "guest_carts"("guest_cart_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guest_cart_items" ADD CONSTRAINT "guest_cart_items_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Orders → User, Address
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_address_id_fkey"
    FOREIGN KEY ("shipping_address_id") REFERENCES "user_addresses"("address_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- OrderItem → Order, Product
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Order history/tracking → Order
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "delivery_tracking" ADD CONSTRAINT "delivery_tracking_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Refund/Return/Replacement → Order
ALTER TABLE "order_refunds" ADD CONSTRAINT "order_refunds_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_replacements" ADD CONSTRAINT "order_replacements_original_order_id_fkey"
    FOREIGN KEY ("original_order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Payment Transactions → Order
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;
