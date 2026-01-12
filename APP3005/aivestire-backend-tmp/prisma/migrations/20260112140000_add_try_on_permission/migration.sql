-- CreateEnum (only if not exists)
DO $$ BEGIN
    CREATE TYPE "TryOnPermissionStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable (add column only if not exists)
DO $$ BEGIN
    ALTER TABLE "User" ADD COLUMN "try_on_permission" "TryOnPermissionStatus" NOT NULL DEFAULT 'NONE';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
