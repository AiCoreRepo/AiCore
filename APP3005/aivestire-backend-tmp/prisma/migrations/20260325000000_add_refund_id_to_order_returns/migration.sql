ALTER TABLE "order_returns"
ADD COLUMN IF NOT EXISTS "refund_id" UUID;
