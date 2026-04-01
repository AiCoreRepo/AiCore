-- AlterTable
ALTER TABLE "User" ADD COLUMN     "max_try_ons" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "try_ons_used" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "try_ons" (
    "try_on_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "aura_id" UUID NOT NULL,
    "result_image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "try_ons_pkey" PRIMARY KEY ("try_on_id")
);

-- CreateIndex
CREATE INDEX "try_ons_user_id_idx" ON "try_ons"("user_id");

-- AddForeignKey
ALTER TABLE "try_ons" ADD CONSTRAINT "try_ons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "try_ons" ADD CONSTRAINT "try_ons_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "try_ons" ADD CONSTRAINT "try_ons_aura_id_fkey" FOREIGN KEY ("aura_id") REFERENCES "Aura"("aura_id") ON DELETE RESTRICT ON UPDATE CASCADE;
