-- AlterTable - Add provider column to try_ons table
ALTER TABLE "try_ons" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'unknown';
