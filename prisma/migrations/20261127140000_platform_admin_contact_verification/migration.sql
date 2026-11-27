-- =============================================================================
-- Company Admin Mandatory Email & Phone Verification Timestamps
-- =============================================================================

ALTER TABLE "platform_admins"
  ADD COLUMN IF NOT EXISTS "email_verified_at" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "phone_verified_at" TIMESTAMPTZ(6);
