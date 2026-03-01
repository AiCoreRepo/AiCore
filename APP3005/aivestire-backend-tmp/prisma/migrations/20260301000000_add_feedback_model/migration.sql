-- ============================================
-- MIGRATION: Add Feedback Model
-- Date: 2026-03-01
-- Description: Adds feedback model and context enum
-- ============================================

-- ============================================
-- STEP 1: Create Enum
-- ============================================

CREATE TYPE "FeedbackContextType" AS ENUM (
  'AVATAR_CREATION',
  'AVATAR_RECREATION',
  'VIRTUAL_TRYON'
);

-- ============================================
-- STEP 2: Create Feedback Table
-- ============================================

CREATE TABLE IF NOT EXISTS "Feedback" (
  "feedback_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "context_type" "FeedbackContextType" NOT NULL,
  "context_reference_id" TEXT,
  "context_label" TEXT,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Feedback_pkey" PRIMARY KEY ("feedback_id")
);

CREATE INDEX IF NOT EXISTS "Feedback_user_id_created_at_idx" ON "Feedback"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "Feedback_context_type_rating_created_at_idx" ON "Feedback"("context_type", "rating", "created_at");

-- ============================================
-- STEP 3: Add Foreign Key
-- ============================================

ALTER TABLE "Feedback"
  ADD CONSTRAINT "Feedback_user_id_fkey"
  FOREIGN KEY ("user_id")
  REFERENCES "User"("user_id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
