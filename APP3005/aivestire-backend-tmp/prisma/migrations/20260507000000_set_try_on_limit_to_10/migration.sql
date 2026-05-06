ALTER TABLE "User"
ALTER COLUMN "max_try_ons" SET DEFAULT 10;

UPDATE "User"
SET "max_try_ons" = 10;
