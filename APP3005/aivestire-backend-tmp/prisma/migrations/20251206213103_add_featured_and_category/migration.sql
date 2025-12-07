-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" TEXT,
ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false;
