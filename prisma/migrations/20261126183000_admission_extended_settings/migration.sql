-- Additive migration for per-school customizable Admission Settings (extended_config JSONB)

ALTER TABLE "admission_settings"
  ADD COLUMN IF NOT EXISTS "extended_config" JSONB;
