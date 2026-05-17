CREATE TYPE "TryOnPackPurchaseStatus" AS ENUM (
    'CREATED',
    'CAPTURED',
    'FAILED',
    'CANCELLED'
);

CREATE TABLE "try_on_pack_purchases" (
    "purchase_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "plan_id" TEXT NOT NULL,
    "pack_name" TEXT NOT NULL,
    "try_ons" INTEGER NOT NULL,
    "amount_paise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "gateway" "PaymentGateway" NOT NULL DEFAULT 'PAYU',
    "gateway_order_id" TEXT,
    "gateway_payment_id" TEXT,
    "status" "TryOnPackPurchaseStatus" NOT NULL DEFAULT 'CREATED',
    "payment_method" TEXT,
    "return_path" TEXT,
    "metadata" JSONB,
    "credited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "try_on_pack_purchases_pkey" PRIMARY KEY ("purchase_id")
);

CREATE UNIQUE INDEX "try_on_pack_purchases_gateway_order_id_key"
ON "try_on_pack_purchases"("gateway_order_id");

CREATE INDEX "try_on_pack_purchases_user_id_idx"
ON "try_on_pack_purchases"("user_id");

CREATE INDEX "try_on_pack_purchases_gateway_order_id_idx"
ON "try_on_pack_purchases"("gateway_order_id");

CREATE INDEX "try_on_pack_purchases_gateway_payment_id_idx"
ON "try_on_pack_purchases"("gateway_payment_id");

CREATE INDEX "try_on_pack_purchases_status_idx"
ON "try_on_pack_purchases"("status");

CREATE INDEX "try_on_pack_purchases_created_at_idx"
ON "try_on_pack_purchases"("created_at" DESC);

ALTER TABLE "try_on_pack_purchases"
ADD CONSTRAINT "try_on_pack_purchases_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("user_id")
ON DELETE CASCADE ON UPDATE CASCADE;
