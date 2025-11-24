-- CreateTable
CREATE TABLE "User" (
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "phone" TEXT,
    "is_creator" BOOLEAN NOT NULL DEFAULT false,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Creator" (
    "creator_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "store_name" TEXT NOT NULL,
    "store_slug" TEXT NOT NULL,
    "about" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Creator_pkey" PRIMARY KEY ("creator_id")
);

-- CreateTable
CREATE TABLE "CreatorLimit" (
    "creator_id" UUID NOT NULL,
    "max_products" INTEGER NOT NULL DEFAULT 100,
    "max_images_per_product" INTEGER NOT NULL DEFAULT 20,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorLimit_pkey" PRIMARY KEY ("creator_id")
);

-- CreateTable
CREATE TABLE "Product" (
    "product_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "creator_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "inventory_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "max_images" INTEGER NOT NULL DEFAULT 20,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "image_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("image_id")
);

-- CreateTable
CREATE TABLE "ProductApproval" (
    "approval_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "submitted_by" UUID,
    "admin_user_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actioned_at" TIMESTAMP(3),

    CONSTRAINT "ProductApproval_pkey" PRIMARY KEY ("approval_id")
);

-- CreateTable
CREATE TABLE "ApprovalLog" (
    "log_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "approval_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalLog_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "ProductStat" (
    "product_id" UUID NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3),

    CONSTRAINT "ProductStat_pkey" PRIMARY KEY ("product_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Creator_user_id_key" ON "Creator"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Creator_store_slug_key" ON "Creator"("store_slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- AddForeignKey
ALTER TABLE "Creator" ADD CONSTRAINT "Creator_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorLimit" ADD CONSTRAINT "CreatorLimit_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "Creator"("creator_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "Creator"("creator_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductApproval" ADD CONSTRAINT "ProductApproval_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductApproval" ADD CONSTRAINT "ProductApproval_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductApproval" ADD CONSTRAINT "ProductApproval_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalLog" ADD CONSTRAINT "ApprovalLog_approval_id_fkey" FOREIGN KEY ("approval_id") REFERENCES "ProductApproval"("approval_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStat" ADD CONSTRAINT "ProductStat_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;
