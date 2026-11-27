-- =============================================================================
-- Company Admin Forced First-Login Password Change, TOTP 2FA & WebAuthn Passkeys
-- =============================================================================

ALTER TABLE "platform_admins"
  ADD COLUMN IF NOT EXISTS "must_change_password" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "password_changed_at" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "totp_secret_enc" TEXT,
  ADD COLUMN IF NOT EXISTS "recovery_code_hashes" JSONB;

ALTER TABLE "platform_admin_sessions"
  ADD COLUMN IF NOT EXISTS "mfa_verified" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "platform_admin_passkeys" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "admin_id" UUID NOT NULL,
  "credential_id" VARCHAR(512) NOT NULL,
  "public_key_spki" TEXT NOT NULL,
  "algorithm" INTEGER NOT NULL DEFAULT -7,
  "device_name" VARCHAR(120) NOT NULL DEFAULT 'Passkey Device',
  "counter" INTEGER NOT NULL DEFAULT 0,
  "last_used_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "platform_admin_passkeys_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "platform_admin_passkeys_admin_id_fkey"
    FOREIGN KEY ("admin_id") REFERENCES "platform_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "platform_admin_passkeys_credential_id_key"
  ON "platform_admin_passkeys" ("credential_id");
CREATE INDEX IF NOT EXISTS "platform_admin_passkeys_admin_id_idx"
  ON "platform_admin_passkeys" ("admin_id");

ALTER TABLE "platform_admin_passkeys" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'platform_admin_passkeys'
      AND policyname = 'platform_admin_only_passkeys'
  ) THEN
    CREATE POLICY "platform_admin_only_passkeys" ON "platform_admin_passkeys"
      AS PERMISSIVE FOR ALL
      USING (current_setting('app.platform_admin', true) = 'true')
      WITH CHECK (current_setting('app.platform_admin', true) = 'true');
  END IF;
END $$;
