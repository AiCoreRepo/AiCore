-- AlterTable
ALTER TABLE "try_ons" ADD COLUMN     "angles_generated" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "cloudinary_public_id" TEXT,
ADD COLUMN     "compressed_url" TEXT,
ADD COLUMN     "metadata_cache" JSONB,
ADD COLUMN     "processing_metrics" JSONB,
ADD COLUMN     "thumbnail_url" TEXT;

-- CreateIndex
CREATE INDEX "try_ons_cloudinary_public_id_idx" ON "try_ons"("cloudinary_public_id");
