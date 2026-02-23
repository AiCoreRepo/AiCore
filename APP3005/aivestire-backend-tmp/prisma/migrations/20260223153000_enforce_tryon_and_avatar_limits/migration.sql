-- Enforce per-user usage limits
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "has_created_aura" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "max_avatar_regenerations" INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS "avatar_regenerations_used" INTEGER NOT NULL DEFAULT 0;

-- Virtual try-on cap: 3 per user
ALTER TABLE "User"
  ALTER COLUMN "max_try_ons" SET DEFAULT 3;

UPDATE "User"
SET "max_try_ons" = 3
WHERE "max_try_ons" > 3;

-- Users who already have an Aura should be treated as having already created one
UPDATE "User" u
SET "has_created_aura" = true
WHERE EXISTS (
  SELECT 1
  FROM "Aura" a
  WHERE a."user_id" = u."user_id"
);
