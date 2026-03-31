-- ============================================================
-- Migration: switch_razorpay_to_payu
-- Date: 2026-03-24
-- Description:
--   Replaces Razorpay with PayU as the payment gateway.
--   1. Add PAYU value to PaymentGateway enum
--   2. Add PAYU value to PaymentMethod enum
--   3. Migrate existing RAZORPAY rows → PAYU
--   4. Change default gateway on payment_transactions to PAYU
--   5. Remove RAZORPAY from both enums (safe rename via new type)
-- ============================================================

-- -------------------------------------------------------
-- STEP 1: Add PAYU to PaymentGateway enum
-- -------------------------------------------------------
ALTER TYPE "PaymentGateway" ADD VALUE IF NOT EXISTS 'PAYU';

-- -------------------------------------------------------
-- STEP 2: Add PAYU to PaymentMethod enum
-- -------------------------------------------------------
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'PAYU';

-- -------------------------------------------------------
-- STEP 3: Migrate existing data
-- -------------------------------------------------------
UPDATE "payment_transactions"
    SET "gateway" = 'PAYU'
    WHERE "gateway" = 'RAZORPAY';

UPDATE "payment_transactions"
    SET "payment_method" = 'payu'
    WHERE "payment_method" = 'razorpay';

UPDATE "orders"
    SET "payment_method" = 'PAYU'
    WHERE "payment_method" = 'RAZORPAY';

-- -------------------------------------------------------
-- STEP 4: Change DEFAULT on payment_transactions.gateway
-- -------------------------------------------------------
ALTER TABLE "payment_transactions"
    ALTER COLUMN "gateway" SET DEFAULT 'PAYU';

-- -------------------------------------------------------
-- STEP 5: Remove RAZORPAY from PaymentGateway enum
-- -------------------------------------------------------
ALTER TYPE "PaymentGateway" RENAME TO "PaymentGateway_old";
CREATE TYPE "PaymentGateway" AS ENUM ('PAYU', 'COD');
ALTER TABLE "payment_transactions"
    ALTER COLUMN "gateway" TYPE "PaymentGateway"
    USING "gateway"::text::"PaymentGateway";
DROP TYPE "PaymentGateway_old";

-- -------------------------------------------------------
-- STEP 6: Remove RAZORPAY from PaymentMethod enum
-- -------------------------------------------------------
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
CREATE TYPE "PaymentMethod" AS ENUM ('PREPAID', 'COD', 'PAYU', 'WALLET');
ALTER TABLE "orders"
    ALTER COLUMN "payment_method" TYPE "PaymentMethod"
    USING "payment_method"::text::"PaymentMethod";
DROP TYPE "PaymentMethod_old";
