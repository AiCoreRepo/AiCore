-- ============================================================
-- Migration: 0008_add_payu_enums
-- Description: Adds PAYU to PaymentGateway and PaymentMethod enums.
-- This must be in its own migration because PostgreSQL requires
-- ALTER TYPE ... ADD VALUE to be committed before the new values
-- can be used in table alterations or data migrations.
-- ============================================================

-- Step 1: Add PAYU to PaymentGateway enum
ALTER TYPE "PaymentGateway" ADD VALUE IF NOT EXISTS 'PAYU';

-- Step 2: Add PAYU to PaymentMethod enum
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'PAYU';
