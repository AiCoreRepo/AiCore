-- ============================================================
-- Migration: Add Categories, SubCategories & Product Groups
-- Date: 2026-03-14
-- Covers:
--   1. `categories` table
--   2. `sub_categories` table
--   3. `category_id` + `sub_category_id` columns on Product
--   4. `product_groups` table
--   5. `product_group_assignments` table
-- ============================================================

-- -------------------------------------------------------
-- 1. CREATE TABLE: categories
-- -------------------------------------------------------
CREATE TABLE "categories" (
    "category_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name"        TEXT NOT NULL,
    "slug"        TEXT NOT NULL,
    "description" TEXT,
    "is_active"   BOOLEAN NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id")
);

-- Unique constraints on categories
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- -------------------------------------------------------
-- 2. CREATE TABLE: sub_categories
-- -------------------------------------------------------
CREATE TABLE "sub_categories" (
    "sub_category_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id"     UUID NOT NULL,
    "name"            TEXT NOT NULL,
    "slug"            TEXT NOT NULL,
    "description"     TEXT,
    "is_active"       BOOLEAN NOT NULL DEFAULT true,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_categories_pkey" PRIMARY KEY ("sub_category_id")
);

-- Unique & index constraints on sub_categories
CREATE UNIQUE INDEX "sub_categories_slug_key"              ON "sub_categories"("slug");
CREATE UNIQUE INDEX "sub_categories_category_id_name_key"  ON "sub_categories"("category_id", "name");
CREATE INDEX        "sub_categories_category_id_idx"       ON "sub_categories"("category_id");

-- Foreign key: sub_categories → categories
ALTER TABLE "sub_categories"
    ADD CONSTRAINT "sub_categories_category_id_fkey"
    FOREIGN KEY ("category_id")
    REFERENCES "categories"("category_id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- -------------------------------------------------------
-- 3. ADD COLUMNS: category_id & sub_category_id on Product
-- -------------------------------------------------------
ALTER TABLE "Product"
    ADD COLUMN "category_id"     UUID,
    ADD COLUMN "sub_category_id" UUID;

-- Foreign keys: Product → categories / sub_categories
ALTER TABLE "Product"
    ADD CONSTRAINT "Product_category_id_fkey"
    FOREIGN KEY ("category_id")
    REFERENCES "categories"("category_id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Product"
    ADD CONSTRAINT "Product_sub_category_id_fkey"
    FOREIGN KEY ("sub_category_id")
    REFERENCES "sub_categories"("sub_category_id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- -------------------------------------------------------
-- 4. CREATE TABLE: product_groups
-- -------------------------------------------------------
CREATE TABLE "product_groups" (
    "group_id"    UUID NOT NULL DEFAULT gen_random_uuid(),
    "creator_id"  UUID NOT NULL,
    "name"        TEXT NOT NULL,
    "slug"        TEXT NOT NULL,
    "description" TEXT,
    "parent_id"   UUID,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_groups_pkey" PRIMARY KEY ("group_id")
);

-- Indexes & unique constraints on product_groups
CREATE UNIQUE INDEX "product_groups_creator_id_slug_key" ON "product_groups"("creator_id", "slug");
CREATE INDEX        "product_groups_creator_id_idx"       ON "product_groups"("creator_id");
CREATE INDEX        "product_groups_parent_id_idx"        ON "product_groups"("parent_id");

-- Foreign keys: product_groups self-ref + creator
ALTER TABLE "product_groups"
    ADD CONSTRAINT "product_groups_parent_id_fkey"
    FOREIGN KEY ("parent_id")
    REFERENCES "product_groups"("group_id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_groups"
    ADD CONSTRAINT "product_groups_creator_id_fkey"
    FOREIGN KEY ("creator_id")
    REFERENCES "Creator"("creator_id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- -------------------------------------------------------
-- 5. CREATE TABLE: product_group_assignments
-- -------------------------------------------------------
CREATE TABLE "product_group_assignments" (
    "assignment_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id"    UUID NOT NULL,
    "group_id"      UUID NOT NULL,
    "assigned_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_group_assignments_pkey" PRIMARY KEY ("assignment_id")
);

-- Indexes & unique constraints on product_group_assignments
CREATE UNIQUE INDEX "product_group_assignments_product_id_group_id_key" ON "product_group_assignments"("product_id", "group_id");
CREATE INDEX        "product_group_assignments_group_id_idx"             ON "product_group_assignments"("group_id");
CREATE INDEX        "product_group_assignments_product_id_idx"           ON "product_group_assignments"("product_id");

-- Foreign keys: product_group_assignments → Product + product_groups
ALTER TABLE "product_group_assignments"
    ADD CONSTRAINT "product_group_assignments_product_id_fkey"
    FOREIGN KEY ("product_id")
    REFERENCES "Product"("product_id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_group_assignments"
    ADD CONSTRAINT "product_group_assignments_group_id_fkey"
    FOREIGN KEY ("group_id")
    REFERENCES "product_groups"("group_id")
    ON DELETE CASCADE ON UPDATE CASCADE;
