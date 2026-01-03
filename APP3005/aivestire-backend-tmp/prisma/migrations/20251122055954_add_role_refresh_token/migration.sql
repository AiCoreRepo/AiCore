-- AlterTable
ALTER TABLE "User" ADD COLUMN     "refresh_token_hash" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'buyer';
