-- ============================================================
-- Migration: 0005_add_wallet_system
-- Description: Creates the wallet system (wallets + transactions)
--   and adds WALLET as a payment method.
-- ============================================================

-- Enums
CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT');
CREATE TYPE "WalletTransactionSource" AS ENUM ('REFUND', 'CASHBACK', 'ORDER_PAYMENT', 'ADMIN_CREDIT', 'PROMOTION');
CREATE TYPE "WalletTransactionStatus" AS ENUM ('SUCCESS', 'FAILED', 'REVERSED');

-- Wallets table
CREATE TABLE "wallets" (
    "wallet_id"  UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id"    UUID NOT NULL,
    "balance"    DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("wallet_id")
);

CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");
CREATE INDEX "wallets_user_id_idx" ON "wallets"("user_id");

-- Wallet transactions table
CREATE TABLE "wallet_transactions" (
    "transaction_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wallet_id"      UUID NOT NULL,
    "type"           "WalletTransactionType" NOT NULL,
    "source"         "WalletTransactionSource" NOT NULL,
    "amount"         DECIMAL(10,2) NOT NULL,
    "reference_id"   TEXT,
    "description"    TEXT,
    "status"         "WalletTransactionStatus" NOT NULL DEFAULT 'SUCCESS',
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("transaction_id")
);

CREATE INDEX "wallet_transactions_wallet_id_idx" ON "wallet_transactions"("wallet_id");
CREATE INDEX "wallet_transactions_type_idx" ON "wallet_transactions"("type");
CREATE INDEX "wallet_transactions_source_idx" ON "wallet_transactions"("source");
CREATE INDEX "wallet_transactions_created_at_idx" ON "wallet_transactions"("created_at" DESC);

-- Foreign keys
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey"
    FOREIGN KEY ("wallet_id") REFERENCES "wallets"("wallet_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add WALLET to PaymentMethod enum
ALTER TYPE "PaymentMethod" ADD VALUE 'WALLET';
