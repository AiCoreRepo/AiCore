-- CreateTable
CREATE TABLE "product_groups" (
    "group_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "creator_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_groups_pkey" PRIMARY KEY ("group_id")
);

-- CreateTable
CREATE TABLE "product_group_assignments" (
    "assignment_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_group_assignments_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateIndex
CREATE INDEX "product_groups_creator_id_idx" ON "product_groups"("creator_id");

-- CreateIndex
CREATE INDEX "product_groups_parent_id_idx" ON "product_groups"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_groups_creator_id_slug_key" ON "product_groups"("creator_id", "slug");

-- CreateIndex
CREATE INDEX "product_group_assignments_group_id_idx" ON "product_group_assignments"("group_id");

-- CreateIndex
CREATE INDEX "product_group_assignments_product_id_idx" ON "product_group_assignments"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_group_assignments_product_id_group_id_key" ON "product_group_assignments"("product_id", "group_id");

-- AddForeignKey
ALTER TABLE "product_groups" ADD CONSTRAINT "product_groups_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "product_groups"("group_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_groups" ADD CONSTRAINT "product_groups_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "Creator"("creator_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_group_assignments" ADD CONSTRAINT "product_group_assignments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_group_assignments" ADD CONSTRAINT "product_group_assignments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "product_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;
