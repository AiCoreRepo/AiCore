-- CreateTable
CREATE TABLE IF NOT EXISTS "otp_verifications" (
    "otp_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone_number" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("otp_id")
);

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone_verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "otp_verifications_phone_number_idx" ON "otp_verifications"("phone_number");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "otp_verifications_expires_at_idx" ON "otp_verifications"("expires_at");
