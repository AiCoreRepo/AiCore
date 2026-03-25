-- ============================================================
-- Creator Upload Flow: Product Hierarchy Migration
-- Product → Pattern (Body Shape) → Color Variant (Skin Tone + Stock + Images)
-- ============================================================

-- ── ENUMS ────────────────────────────────────────────────────

CREATE TYPE "BodyShape" AS ENUM (
  'HOURGLASS',
  'PEAR',
  'APPLE',
  'RECTANGLE',
  'INVERTED_TRIANGLE',
  'OVAL',
  'ATHLETIC',
  'PETITE',
  'PLUS_SIZE'
);

CREATE TYPE "SkinTone" AS ENUM (
  'FAIR',
  'LIGHT',
  'MEDIUM',
  'OLIVE',
  'TAN',
  'BROWN',
  'DARK_BROWN',
  'DEEP'
);

CREATE TYPE "ClothingColor" AS ENUM (
  'BLACK',
  'WHITE',
  'GREY',
  'CHARCOAL',
  'NAVY',
  'ROYAL_BLUE',
  'SKY_BLUE',
  'TEAL',
  'GREEN',
  'OLIVE_GREEN',
  'MINT',
  'RED',
  'MAROON',
  'PINK',
  'HOT_PINK',
  'CORAL',
  'ORANGE',
  'YELLOW',
  'GOLD',
  'BEIGE',
  'CREAM',
  'BROWN',
  'CHOCOLATE',
  'CARAMEL',
  'LAVENDER',
  'PURPLE',
  'INDIGO',
  'RUST',
  'OFF_WHITE',
  'MULTI_COLOR',
  'PRINTED',
  'OTHER'
);

-- ── TABLE: product_patterns ───────────────────────────────────

CREATE TABLE "product_patterns" (
  "pattern_id"    UUID        NOT NULL DEFAULT gen_random_uuid(),
  "product_id"    UUID        NOT NULL,
  "name"          TEXT        NOT NULL,
  "body_shapes"   "BodyShape"[]        NOT NULL DEFAULT '{}',
  "display_order" INTEGER     NOT NULL DEFAULT 0,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "product_patterns_pkey" PRIMARY KEY ("pattern_id"),
  CONSTRAINT "product_patterns_product_id_fkey"
    FOREIGN KEY ("product_id")
    REFERENCES "Product"("product_id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "product_patterns_product_id_idx" ON "product_patterns"("product_id");

-- ── TABLE: product_color_variants ────────────────────────────

CREATE TABLE "product_color_variants" (
  "variant_id"    UUID            NOT NULL DEFAULT gen_random_uuid(),
  "pattern_id"    UUID            NOT NULL,
  "color"         "ClothingColor" NOT NULL,
  "hex_code"      TEXT,
  "stock"         INTEGER         NOT NULL DEFAULT 0,
  "skin_tones"    "SkinTone"[]             NOT NULL DEFAULT '{}',
  "display_order" INTEGER         NOT NULL DEFAULT 0,
  "created_at"    TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3)    NOT NULL,

  CONSTRAINT "product_color_variants_pkey" PRIMARY KEY ("variant_id"),
  CONSTRAINT "product_color_variants_pattern_id_fkey"
    FOREIGN KEY ("pattern_id")
    REFERENCES "product_patterns"("pattern_id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "product_color_variants_pattern_id_idx" ON "product_color_variants"("pattern_id");

-- ── TABLE: product_color_variant_images ──────────────────────

CREATE TABLE "product_color_variant_images" (
  "image_id"      UUID         NOT NULL DEFAULT gen_random_uuid(),
  "variant_id"    UUID         NOT NULL,
  "url"           TEXT         NOT NULL,
  "order_index"   INTEGER      NOT NULL DEFAULT 0,
  "is_primary"    BOOLEAN      NOT NULL DEFAULT false,
  "uploaded_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_color_variant_images_pkey" PRIMARY KEY ("image_id"),
  CONSTRAINT "product_color_variant_images_variant_id_fkey"
    FOREIGN KEY ("variant_id")
    REFERENCES "product_color_variants"("variant_id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "product_color_variant_images_variant_id_idx" ON "product_color_variant_images"("variant_id");

-- ── Fix Product default status to DRAFT ──────────────────────
-- Previously PENDING; new products should start as DRAFT
ALTER TABLE "Product"
  ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"ProductStatus";
