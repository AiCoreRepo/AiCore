-- AlterTable (add angle column only if not exists)
DO $$ BEGIN
    ALTER TABLE "try_ons" ADD COLUMN "angle" TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- AlterTable (add base_tryon_id column only if not exists)
DO $$ BEGIN
    ALTER TABLE "try_ons" ADD COLUMN "base_tryon_id" UUID;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- AddForeignKey (only if not exists)
DO $$ BEGIN
    ALTER TABLE "try_ons" ADD CONSTRAINT "try_ons_base_tryon_id_fkey" FOREIGN KEY ("base_tryon_id") REFERENCES "try_ons"("try_on_id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateIndex (only if not exists)
CREATE INDEX IF NOT EXISTS "try_ons_aura_id_product_id_angle_idx" ON "try_ons"("aura_id", "product_id", "angle");
