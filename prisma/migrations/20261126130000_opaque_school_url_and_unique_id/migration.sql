-- Additive PostgreSQL migration for Unique School ID (`schools.unique_id`)
-- and backfill of missing unique IDs on existing school records.
-- Note: Existing `schools.slug` values are preserved by default so existing links do not break unexpectedly;
-- new registrations receive opaque hashed/random `sc_<hex>` URL tokens automatically.

ALTER TABLE "schools"
  ADD COLUMN IF NOT EXISTS "unique_id" VARCHAR(32);

-- Backfill any existing schools that lack a unique_id using a deterministic prefix + UUID fragment
UPDATE "schools"
SET "unique_id" = UPPER('SNX-' || EXTRACT(YEAR FROM COALESCE("created_at", NOW()))::INT || '-' || SUBSTRING(REPLACE("id"::TEXT, '-', '') FROM 1 FOR 6))
WHERE "unique_id" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "schools_unique_id_key" ON "schools"("unique_id");
CREATE INDEX IF NOT EXISTS "schools_unique_id_idx" ON "schools"("unique_id");
