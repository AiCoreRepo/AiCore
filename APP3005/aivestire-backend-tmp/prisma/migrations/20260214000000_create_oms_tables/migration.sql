-- ============================================================
-- Migration: create_oms_tables (Foundational Consolidated)
-- Date: 2026-02-14
-- Description: Creates the complete Order Management System (OMS) 
--   including Refund, Return, and Replacement (RRR) tables.
--   This consolidation ensures that production environments that
--   skipped the Feb 15 migration will still have all required tables.
-- ============================================================

-- Step 1: Create Enums
DO $$ BEGIN
    CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'BOOKED', 'DISPATCHED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('PREPAID', 'COD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ChangedByType" AS ENUM ('SYSTEM', 'ADMIN', 'DELIVERY_PARTNER', 'USER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "LocationType" AS ENUM ('WAREHOUSE', 'TRANSIT_HUB', 'LOCAL_FACILITY', 'OUT_FOR_DELIVERY', 'DELIVERED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "RefundStatus" AS ENUM ('INITIATED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReturnReason" AS ENUM ('DAMAGED', 'DEFECTIVE', 'WRONG_ITEM', 'SIZE_ISSUE', 'COLOR_DIFFERENCE', 'QUALITY_ISSUE', 'NOT_AS_DESCRIBED', 'CHANGED_MIND', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'QC_PASSED', 'QC_FAILED', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReplaceReason" AS ENUM ('DAMAGED', 'DEFECTIVE', 'WRONG_ITEM', 'SIZE_ISSUE', 'COLOR_DIFFERENCE', 'QUALITY_ISSUE', 'NOT_AS_DESCRIBED', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReplacementStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'DISPATCHED', 'DELIVERED', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create orders table
CREATE TABLE IF NOT EXISTS "orders" (
    "order_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_number" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    
    -- Order Details
    "total_amount" DECIMAL(10,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    
    -- Current State
    "current_status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    
    -- COD Specific
    "cod_collected" BOOLEAN NOT NULL DEFAULT false,
    "cod_collected_at" TIMESTAMP(3),
    "cod_collected_by" UUID,
    
    -- Shipping Address
    "shipping_address_id" UUID NOT NULL,
    
    -- Tracking
    "tracking_number" TEXT,
    "delivery_partner" TEXT,
    "estimated_delivery_date" TIMESTAMP(3),
    
    -- Cancellation
    "cancelled_at" TIMESTAMP(3),
    "cancelled_by" UUID,
    "cancellation_reason" TEXT,
    "cancel_feedback" TEXT,
    
    -- Refund Tracking (added from Feb 15)
    "refund_status" "RefundStatus",
    "refund_amount" DECIMAL(10, 2),
    
    -- Return Tracking (added from Feb 15)
    "return_status" "ReturnStatus",
    "return_requested_at" TIMESTAMP(3),
    
    -- Replacement Tracking (added from Feb 15)
    "replace_status" "ReplacementStatus",
    "replace_requested_at" TIMESTAMP(3),
    
    -- Timestamps
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id")
);

-- Step 3: Create order_items table
CREATE TABLE IF NOT EXISTS "order_items" (
    "order_item_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    
    -- Item Details
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    
    -- Snapshot data
    "product_name" TEXT NOT NULL,
    "product_image" TEXT,
    "variant_details" JSONB,
    "size" TEXT,
    "color" TEXT,
    
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("order_item_id")
);

-- Step 4: Create order_status_history table
CREATE TABLE IF NOT EXISTS "order_status_history" (
    "history_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "changed_by" UUID,
    "changed_by_type" "ChangedByType",
    "notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("history_id")
);

-- Step 5: Create delivery_tracking table
CREATE TABLE IF NOT EXISTS "delivery_tracking" (
    "tracking_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "location_name" TEXT NOT NULL,
    "location_type" "LocationType" NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "status_description" TEXT NOT NULL,
    "delivery_partner_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_tracking_pkey" PRIMARY KEY ("tracking_id")
);

-- Step 6: Create RRR Tables (from Feb 15)
CREATE TABLE IF NOT EXISTS "order_refunds" (
  "refund_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL,
  "amount" DECIMAL(10, 2) NOT NULL,
  "refund_status" "RefundStatus" NOT NULL DEFAULT 'INITIATED',
  "refund_reason" TEXT,
  "approved_by" UUID,
  "approved_at" TIMESTAMP(3),
  "rejection_reason" TEXT,
  "refund_method" TEXT,
  "transaction_id" TEXT,
  "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processing_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "failed_at" TIMESTAMP(3),
  "notes" TEXT,
  "metadata" JSONB,
  CONSTRAINT "order_refunds_pkey" PRIMARY KEY ("refund_id")
);

CREATE TABLE IF NOT EXISTS "order_returns" (
  "return_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL,
  "return_reason" "ReturnReason" NOT NULL,
  "custom_reason" TEXT,
  "feedback" TEXT,
  "return_status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
  "approved_by" UUID,
  "approved_at" TIMESTAMP(3),
  "rejected_by" UUID,
  "rejected_at" TIMESTAMP(3),
  "rejection_reason" TEXT,
  "pickup_scheduled" TIMESTAMP(3),
  "pickup_partner" TEXT,
  "pickup_tracking" TEXT,
  "picked_up_at" TIMESTAMP(3),
  "qc_passed" BOOLEAN,
  "qc_notes" TEXT,
  "qc_completed_at" TIMESTAMP(3),
  "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "notes" TEXT,
  "metadata" JSONB,
  CONSTRAINT "order_returns_pkey" PRIMARY KEY ("return_id")
);

CREATE TABLE IF NOT EXISTS "order_replacements" (
  "replacement_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "original_order_id" UUID NOT NULL,
  "new_order_id" UUID,
  "replace_reason" "ReplaceReason" NOT NULL,
  "custom_reason" TEXT,
  "feedback" TEXT,
  "replacement_status" "ReplacementStatus" NOT NULL DEFAULT 'REQUESTED',
  "approved_by" UUID,
  "approved_at" TIMESTAMP(3),
  "rejected_by" UUID,
  "rejected_at" TIMESTAMP(3),
  "rejection_reason" TEXT,
  "pickup_scheduled" TIMESTAMP(3),
  "pickup_partner" TEXT,
  "pickup_tracking" TEXT,
  "picked_up_at" TIMESTAMP(3),
  "dispatched_at" TIMESTAMP(3),
  "delivery_tracking" TEXT,
  "delivered_at" TIMESTAMP(3),
  "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "notes" TEXT,
  "metadata" JSONB,
  CONSTRAINT "order_replacements_pkey" PRIMARY KEY ("replacement_id")
);

-- Step 7: Create Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "orders_order_number_key" ON "orders"("order_number");
CREATE INDEX IF NOT EXISTS "orders_user_id_idx" ON "orders"("user_id");
CREATE INDEX IF NOT EXISTS "orders_current_status_idx" ON "orders"("current_status");
CREATE INDEX IF NOT EXISTS "orders_order_number_idx" ON "orders"("order_number");
CREATE INDEX IF NOT EXISTS "orders_tracking_number_idx" ON "orders"("tracking_number");
CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders"("created_at" DESC);

CREATE INDEX IF NOT EXISTS "order_items_order_id_idx" ON "order_items"("order_id");
CREATE INDEX IF NOT EXISTS "order_items_product_id_idx" ON "order_items"("product_id");

CREATE INDEX IF NOT EXISTS "order_status_history_order_id_idx" ON "order_status_history"("order_id");
CREATE INDEX IF NOT EXISTS "order_status_history_created_at_idx" ON "order_status_history"("created_at" DESC);

CREATE INDEX IF NOT EXISTS "delivery_tracking_order_id_idx" ON "delivery_tracking"("order_id");
CREATE INDEX IF NOT EXISTS "delivery_tracking_created_at_idx" ON "delivery_tracking"("created_at" DESC);

CREATE INDEX IF NOT EXISTS "order_refunds_order_id_idx" ON "order_refunds"("order_id");
CREATE INDEX IF NOT EXISTS "order_refunds_refund_status_idx" ON "order_refunds"("refund_status");
CREATE INDEX IF NOT EXISTS "order_refunds_initiated_at_idx" ON "order_refunds"("initiated_at" DESC);

CREATE INDEX IF NOT EXISTS "order_returns_order_id_idx" ON "order_returns"("order_id");
CREATE INDEX IF NOT EXISTS "order_returns_return_status_idx" ON "order_returns"("return_status");
CREATE INDEX IF NOT EXISTS "order_returns_requested_at_idx" ON "order_returns"("requested_at" DESC);

CREATE INDEX IF NOT EXISTS "order_replacements_original_order_id_idx" ON "order_replacements"("original_order_id");
CREATE INDEX IF NOT EXISTS "order_replacements_new_order_id_idx" ON "order_replacements"("new_order_id");
CREATE INDEX IF NOT EXISTS "order_replacements_replacement_status_idx" ON "order_replacements"("replacement_status");
CREATE INDEX IF NOT EXISTS "order_replacements_requested_at_idx" ON "order_replacements"("requested_at" DESC);

-- Step 8: Add Foreign Keys
DO $$ BEGIN
    ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_address_id_fkey" FOREIGN KEY ("shipping_address_id") REFERENCES "user_addresses"("address_id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "delivery_tracking" ADD CONSTRAINT "delivery_tracking_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "order_refunds" ADD CONSTRAINT "order_refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "order_replacements" ADD CONSTRAINT "order_replacements_original_order_id_fkey" FOREIGN KEY ("original_order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "order_replacements" ADD CONSTRAINT "order_replacements_new_order_id_fkey" FOREIGN KEY ("new_order_id") REFERENCES "orders"("order_id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
