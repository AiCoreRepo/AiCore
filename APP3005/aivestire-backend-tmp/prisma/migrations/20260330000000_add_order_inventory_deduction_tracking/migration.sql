ALTER TABLE "orders"
ADD COLUMN "inventory_deducted" BOOLEAN NOT NULL DEFAULT false;

UPDATE "orders"
SET "inventory_deducted" = true
WHERE "current_status" <> 'CANCELLED';
