-- Migration: Add Wishlist Feature Tables
-- Created: 2026-02-09
-- Description: Adds wishlists and wishlist_items tables for wishlist functionality

-- Create wishlists table
CREATE TABLE IF NOT EXISTS "wishlists" (
    "wishlist_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("wishlist_id")
);

-- Create wishlist_items table
CREATE TABLE IF NOT EXISTS "wishlist_items" (
    "wishlist_item_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wishlist_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("wishlist_item_id")
);

-- Create unique index on user_id for one-to-one relationship with users
CREATE UNIQUE INDEX IF NOT EXISTS "wishlists_user_id_key" ON "wishlists"("user_id");

-- Create index on wishlist_id for faster lookups
CREATE INDEX IF NOT EXISTS "wishlist_items_wishlist_id_idx" ON "wishlist_items"("wishlist_id");

-- Create unique index to prevent duplicate products in same wishlist
CREATE UNIQUE INDEX IF NOT EXISTS "wishlist_items_wishlist_id_product_id_key" ON "wishlist_items"("wishlist_id", "product_id");

-- Add foreign key constraint for wishlists -> users
DO $$ BEGIN
    ALTER TABLE "wishlists" 
    ADD CONSTRAINT "wishlists_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add foreign key constraint for wishlist_items -> wishlists
DO $$ BEGIN
    ALTER TABLE "wishlist_items" 
    ADD CONSTRAINT "wishlist_items_wishlist_id_fkey" 
    FOREIGN KEY ("wishlist_id") REFERENCES "wishlists"("wishlist_id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add foreign key constraint for wishlist_items -> products
DO $$ BEGIN
    ALTER TABLE "wishlist_items" 
    ADD CONSTRAINT "wishlist_items_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add trigger to update wishlists updated_at timestamp
CREATE OR REPLACE FUNCTION update_wishlists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_wishlists_updated_at ON "wishlists";
CREATE TRIGGER trigger_update_wishlists_updated_at
    BEFORE UPDATE ON "wishlists"
    FOR EACH ROW
    EXECUTE FUNCTION update_wishlists_updated_at();

-- Comments for documentation
COMMENT ON TABLE "wishlists" IS 'Stores user wishlists (one per user)';
COMMENT ON COLUMN "wishlists"."wishlist_id" IS 'Unique identifier for the wishlist';
COMMENT ON COLUMN "wishlists"."user_id" IS 'Foreign key to users table (unique - one wishlist per user)';

COMMENT ON TABLE "wishlist_items" IS 'Stores products saved to wishlists';
COMMENT ON COLUMN "wishlist_items"."wishlist_item_id" IS 'Unique identifier for the wishlist item';
COMMENT ON COLUMN "wishlist_items"."wishlist_id" IS 'Foreign key to wishlists table';
COMMENT ON COLUMN "wishlist_items"."product_id" IS 'Foreign key to products table';
COMMENT ON COLUMN "wishlist_items"."added_at" IS 'Timestamp when product was added to wishlist';
