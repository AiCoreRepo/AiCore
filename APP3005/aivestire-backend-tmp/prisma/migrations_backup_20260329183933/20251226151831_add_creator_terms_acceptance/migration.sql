-- AlterTable
ALTER TABLE "Creator" ADD COLUMN     "terms_accepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "terms_accepted_at" TIMESTAMP(3),
ADD COLUMN     "terms_version" TEXT DEFAULT '1.0';
