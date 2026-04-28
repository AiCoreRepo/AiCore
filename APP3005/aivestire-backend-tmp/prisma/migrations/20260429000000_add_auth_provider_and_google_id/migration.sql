-- Migration: add_auth_provider_and_google_id
-- Adds auth_provider enum and google_id to the User table.
-- Both columns are nullable for full backward compatibility:
--   • auth_provider = NULL  → legacy row, treated as EMAIL in application code
--   • google_id = NULL      → not a Google-authenticated user

-- 1. Create the enum type
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE');

-- 2. Add auth_provider column (nullable, no default → existing rows get NULL)
ALTER TABLE "User" ADD COLUMN "auth_provider" "AuthProvider";

-- 3. Add google_id column (nullable)
ALTER TABLE "User" ADD COLUMN "google_id" TEXT;

-- 4. Unique index on google_id — partial (only where NOT NULL) so multiple
--    EMAIL users with null google_id don't conflict with each other
CREATE UNIQUE INDEX "User_google_id_key" ON "User"("google_id") WHERE "google_id" IS NOT NULL;
