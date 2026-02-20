-- ============================================================
-- Migration: add_payment_transactions
-- Created: 2026-02-19
-- Description: Adds Razorpay payment gateway support
--   - Adds RAZORPAY to PaymentMethod enum
--   - Creates PaymentGateway enum
--   - Creates PaymentTransactionStatus enum
--   - Creates payment_transactions table
-- ============================================================

-- Step 1: Add RAZORPAY to existing PaymentMethod enum
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'RAZORPAY';

-- Step 2: Create PaymentGateway enum
DO $$ BEGIN
    CREATE TYPE "PaymentGateway" AS ENUM ('RAZORPAY', 'COD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 3: Create PaymentTransactionStatus enum
DO $$ BEGIN
    CREATE TYPE "PaymentTransactionStatus" AS ENUM (
        'CREATED',
        'ATTEMPTED',
        'AUTHORIZED',
        'CAPTURED',
        'FAILED',
        'REFUNDED',
        'PARTIALLY_REFUNDED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 4: Create payment_transactions table
CREATE TABLE IF NOT EXISTS "payment_transactions" (
    "transaction_id"     UUID                       NOT NULL DEFAULT gen_random_uuid(),
    "order_id"           UUID                       NOT NULL,

    -- Gateway Info
    "gateway"            "PaymentGateway"           NOT NULL DEFAULT 'RAZORPAY',
    "gateway_order_id"   TEXT,                      -- Razorpay order_XXXX (unique per attempt)
    "gateway_payment_id" TEXT,                      -- Razorpay pay_XXXX

    -- Amount
    "amount_paise"       INTEGER                    NOT NULL,  -- Amount in paise
    "currency"           TEXT                       NOT NULL DEFAULT 'INR',
    "receipt"            TEXT,                      -- Unique receipt sent to Razorpay

    -- Status
    "status"             "PaymentTransactionStatus" NOT NULL DEFAULT 'CREATED',
    "payment_method"     TEXT,                      -- card, upi, netbanking, wallet, etc.

    -- Refund
    "refund_id"          TEXT,                      -- Razorpay refund ID
    "refunded_at"        TIMESTAMP(3),

    -- Timestamps
    "created_at"         TIMESTAMP(3)               NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "captured_at"        TIMESTAMP(3),
    "updated_at"         TIMESTAMP(3)               NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Raw gateway response
    "metadata"           JSONB,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- Step 5: Add foreign key to orders
ALTER TABLE "payment_transactions"
    ADD CONSTRAINT "payment_transactions_order_id_fkey"
    FOREIGN KEY ("order_id")
    REFERENCES "orders"("order_id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- Step 6: Unique constraint on gateway_order_id (one Razorpay order per attempt)
ALTER TABLE "payment_transactions"
    ADD CONSTRAINT "payment_transactions_gateway_order_id_key"
    UNIQUE ("gateway_order_id");

-- Step 7: Indexes for fast lookups
CREATE INDEX IF NOT EXISTS "payment_transactions_order_id_idx"
    ON "payment_transactions"("order_id");

CREATE INDEX IF NOT EXISTS "payment_transactions_gateway_order_id_idx"
    ON "payment_transactions"("gateway_order_id");

CREATE INDEX IF NOT EXISTS "payment_transactions_gateway_payment_id_idx"
    ON "payment_transactions"("gateway_payment_id");

CREATE INDEX IF NOT EXISTS "payment_transactions_status_idx"
    ON "payment_transactions"("status");

CREATE INDEX IF NOT EXISTS "payment_transactions_created_at_idx"
    ON "payment_transactions"("created_at" DESC);

-- Step 8: Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_transactions_updated_at_trigger ON "payment_transactions";

CREATE TRIGGER payment_transactions_updated_at_trigger
    BEFORE UPDATE ON "payment_transactions"
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_transactions_updated_at();
