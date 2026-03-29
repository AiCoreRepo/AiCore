/*
  Warnings:

  - The `status` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `ProductApproval` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `is_admin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `is_creator` on the `User` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AuraStatus" AS ENUM ('PENDING', 'READY', 'ERROR');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BUYER', 'CREATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "status",
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "ProductApproval" DROP COLUMN "status",
ADD COLUMN     "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "is_admin",
DROP COLUMN "is_creator",
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'BUYER';

-- CreateTable
CREATE TABLE "Aura" (
    "aura_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "image_url" TEXT,
    "height_cm" INTEGER,
    "weight_kg" INTEGER,
    "skin_tone" TEXT,
    "gender" TEXT,
    "body_shape" TEXT,
    "age_range" TEXT,
    "hair_style" TEXT,
    "beard" BOOLEAN,
    "extra_attributes" JSONB,
    "model_url" TEXT,
    "generated_avatar_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attributes" JSONB,
    "status" "AuraStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aura_pkey" PRIMARY KEY ("aura_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Aura_user_id_key" ON "Aura"("user_id");

-- CreateIndex
CREATE INDEX "Aura_status_idx" ON "Aura"("status");

-- AddForeignKey
ALTER TABLE "Aura" ADD CONSTRAINT "Aura_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
