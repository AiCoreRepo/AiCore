ALTER TABLE "User"
ALTER COLUMN "max_try_ons" SET DEFAULT 3,
ALTER COLUMN "try_ons_used" SET DEFAULT 0;

UPDATE "User"
SET
  "max_try_ons" = 3,
  "try_ons_used" = 0
WHERE
  "max_try_ons" IS DISTINCT FROM 3
  OR "try_ons_used" IS DISTINCT FROM 0;
