-- Additive PostgreSQL migration for Unique School ID (`schools.unique_id`)
-- and opaque URL token (`schools.slug`) backfill on existing school records.

ALTER TABLE "schools"
  ADD COLUMN IF NOT EXISTS "unique_id" VARCHAR(32);

-- Backfill any existing schools that lack a unique_id using a deterministic prefix + UUID fragment
UPDATE "schools"
SET "unique_id" = UPPER('SNX-' || EXTRACT(YEAR FROM COALESCE("created_at", NOW()))::INT || '-' || SUBSTRING(REPLACE("id"::TEXT, '-', '') FROM 1 FOR 6))
WHERE "unique_id" IS NULL;

-- Rotate any legacy school-name slug to an opaque non-guessable sc_<20 hex chars> token
UPDATE "schools"
SET "slug" = 'sc_' || SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', '') || REPLACE("id"::TEXT, '-', '') FROM 1 FOR 20)
WHERE "slug" !~ '^sc_[0-9a-f]{20,}$';

CREATE UNIQUE INDEX IF NOT EXISTS "schools_unique_id_key" ON "schools"("unique_id");
CREATE INDEX IF NOT EXISTS "schools_unique_id_idx" ON "schools"("unique_id");
