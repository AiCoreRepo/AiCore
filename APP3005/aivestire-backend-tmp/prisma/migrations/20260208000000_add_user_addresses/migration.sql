-- Migration: Add User Addresses for Cart Feature
-- Created: 2026-02-08
-- Description: Adds user_addresses table for storing delivery addresses

-- Create AddressType enum if not exists
DO $$ BEGIN
    CREATE TYPE "AddressType" AS ENUM ('HOME', 'WORK', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_addresses table
CREATE TABLE IF NOT EXISTS "user_addresses" (
    "address_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "landmark" TEXT,
    "address_type" "AddressType" NOT NULL DEFAULT 'HOME',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("address_id")
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS "user_addresses_user_id_idx" ON "user_addresses"("user_id");

-- Create index on is_default for faster default address lookup
CREATE INDEX IF NOT EXISTS "user_addresses_is_default_idx" ON "user_addresses"("user_id", "is_default");

-- Add foreign key constraint
DO $$ BEGIN
    ALTER TABLE "user_addresses" 
    ADD CONSTRAINT "user_addresses_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_addresses_updated_at ON "user_addresses";
CREATE TRIGGER trigger_update_user_addresses_updated_at
    BEFORE UPDATE ON "user_addresses"
    FOR EACH ROW
    EXECUTE FUNCTION update_user_addresses_updated_at();

-- Comments for documentation
COMMENT ON TABLE "user_addresses" IS 'Stores delivery addresses for users';
COMMENT ON COLUMN "user_addresses"."address_id" IS 'Unique identifier for the address';
COMMENT ON COLUMN "user_addresses"."user_id" IS 'Foreign key to users table';
COMMENT ON COLUMN "user_addresses"."full_name" IS 'Recipient full name';
COMMENT ON COLUMN "user_addresses"."phone" IS '10-digit Indian mobile number';
COMMENT ON COLUMN "user_addresses"."pincode" IS '6-digit Indian postal code';
COMMENT ON COLUMN "user_addresses"."address_line1" IS 'House No, Building, Street';
COMMENT ON COLUMN "user_addresses"."address_line2" IS 'Locality, Area (optional)';
COMMENT ON COLUMN "user_addresses"."city" IS 'City name';
COMMENT ON COLUMN "user_addresses"."state" IS 'Indian state name';
COMMENT ON COLUMN "user_addresses"."landmark" IS 'Nearby landmark (optional)';
COMMENT ON COLUMN "user_addresses"."address_type" IS 'Type of address: HOME, WORK, or OTHER';
COMMENT ON COLUMN "user_addresses"."is_default" IS 'Whether this is the default delivery address';
