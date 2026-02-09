-- Enterprise Cart System Migration
-- Adds GuestCart tables and updates Cart/CartItem with enterprise fields

-- Add new fields to existing Cart table
ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "merged_from_guest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "region" TEXT NOT NULL DEFAULT 'IN';
ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "channel" TEXT NOT NULL DEFAULT 'WEB';

-- Add size/color variants to existing CartItem table
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "size" TEXT;
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "color" TEXT;

-- Drop old unique constraint on cart_items (cart_id, product_id)
-- and create new composite unique constraint (cart_id, product_id, size, color)
ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "cart_items_cart_id_product_id_key";
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_product_id_size_color_key" 
    UNIQUE ("cart_id", "product_id", "size", "color");

-- Create GuestCart table for session-based carts
CREATE TABLE IF NOT EXISTS "guest_carts" (
    "guest_cart_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'IN',
    "channel" TEXT NOT NULL DEFAULT 'WEB',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "guest_carts_pkey" PRIMARY KEY ("guest_cart_id")
);

-- Create unique index on session_id for guest carts
CREATE UNIQUE INDEX IF NOT EXISTS "guest_carts_session_id_key" ON "guest_carts"("session_id");

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS "guest_carts_expires_at_idx" ON "guest_carts"("expires_at");

-- Create index on session_id for lookup queries
CREATE INDEX IF NOT EXISTS "guest_carts_session_id_idx" ON "guest_carts"("session_id");

-- Create GuestCartItem table for guest cart items
CREATE TABLE IF NOT EXISTS "guest_cart_items" (
    "guest_cart_item_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "guest_cart_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "size" TEXT,
    "color" TEXT,
    "price_cents_snapshot" INTEGER NOT NULL,
    "currency_snapshot" TEXT NOT NULL DEFAULT 'INR',
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "guest_cart_items_pkey" PRIMARY KEY ("guest_cart_item_id")
);

-- Create unique constraint for guest cart items (cart + product + size + color)
ALTER TABLE "guest_cart_items" ADD CONSTRAINT "guest_cart_items_guest_cart_id_product_id_size_color_key" 
    UNIQUE ("guest_cart_id", "product_id", "size", "color");

-- Create indexes for guest_cart_items
CREATE INDEX IF NOT EXISTS "guest_cart_items_guest_cart_id_idx" ON "guest_cart_items"("guest_cart_id");
CREATE INDEX IF NOT EXISTS "guest_cart_items_product_id_idx" ON "guest_cart_items"("product_id");

-- Add foreign key constraints
ALTER TABLE "guest_cart_items" 
    ADD CONSTRAINT "guest_cart_items_guest_cart_id_fkey" 
    FOREIGN KEY ("guest_cart_id") 
    REFERENCES "guest_carts"("guest_cart_id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

ALTER TABLE "guest_cart_items" 
    ADD CONSTRAINT "guest_cart_items_product_id_fkey" 
    FOREIGN KEY ("product_id") 
    REFERENCES "products"("product_id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;
