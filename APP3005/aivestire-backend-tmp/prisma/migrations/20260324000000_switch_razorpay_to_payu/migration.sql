-- ============================================================
-- Migration: switch_razorpay_to_payu
-- Date: 2026-03-24
-- Description:
--   Replaces Razorpay with PayU as the payment gateway.
--   1. Add PAYU value to PaymentGateway enum
--   2. Add PAYU value to PaymentMethod enum
--   3. Migrate existing RAZORPAY gateway_order_id rows → PAYU
--   4. Change default gateway on payment_transactions to PAYU
--   5. Remove RAZORPAY from both enums (safe rename via new type)
-- ============================================================

-- -------------------------------------------------------
-- STEP 1: Add PAYU value to PaymentGateway enum
-- PostgreSQL cannot remove enum values directly, so we:
--   a) Add the new value first
--   b) Migrate data
--   c) Recreate enum without the old value
-- -------------------------------------------------------
ALTER TYPE "PaymentGateway" ADD VALUE IF NOT EXISTS 'PAYU';

-- -------------------------------------------------------
-- STEP 2: Add PAYU value to PaymentMethod enum
-- -------------------------------------------------------
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'PAYU';

-- -------------------------------------------------------
-- STEP 3: Migrate existing data
--   Update any RAZORPAY gateway rows → PAYU
--   Update any RAZORPAY payment_method rows → PAYU
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
-- STEP 4: Change the DEFAULT on payment_transactions.gateway
--         from RAZORPAY → PAYU
-- -------------------------------------------------------
ALTER TABLE "payment_transactions"
    ALTER COLUMN "gateway" SET DEFAULT 'PAYU';

-- -------------------------------------------------------
-- STEP 5: Safely remove RAZORPAY from PaymentGateway enum
--
-- PostgreSQL does not support DROP VALUE on enums directly.
-- We rename the old type, create a clean new one, cast, then drop old.
-- -------------------------------------------------------

-- 5a. Rename old enum
ALTER TYPE "PaymentGateway" RENAME TO "PaymentGateway_old";

-- 5b. Create new clean enum (PAYU + COD only — matches schema.prisma)
CREATE TYPE "PaymentGateway" AS ENUM ('PAYU', 'COD');

-- 5c. Alter table column to use new enum (cast via text)
ALTER TABLE "payment_transactions"
    ALTER COLUMN "gateway" TYPE "PaymentGateway"
    USING "gateway"::text::"PaymentGateway";

-- 5d. Drop old enum
DROP TYPE "PaymentGateway_old";

-- -------------------------------------------------------
-- STEP 6: Safely remove RAZORPAY from PaymentMethod enum
-- -------------------------------------------------------

-- 6a. Rename old enum
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";

-- 6b. Create new clean enum (matches schema.prisma)
CREATE TYPE "PaymentMethod" AS ENUM ('PREPAID', 'COD', 'PAYU', 'WALLET');

-- 6c. Alter orders table column to use new enum
ALTER TABLE "orders"
    ALTER COLUMN "payment_method" TYPE "PaymentMethod"
    USING "payment_method"::text::"PaymentMethod";

-- 6d. Drop old enum
DROP TYPE "PaymentMethod_old";

-- -------------------------------------------------------
-- DONE
-- -------------------------------------------------------
