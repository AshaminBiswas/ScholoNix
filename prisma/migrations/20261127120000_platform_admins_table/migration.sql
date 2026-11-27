-- =============================================================================
-- Dedicated Company Admin & Platform Team Tables (Isolated from School Users)
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE "PlatformAdminRole" AS ENUM ('SUPER_ADMIN', 'OPERATIONS', 'BILLING_MANAGER', 'SUPPORT_AGENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PlatformAdminStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "platform_admins" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(30),
  "password_hash" VARCHAR(255) NOT NULL,
  "role" "PlatformAdminRole" NOT NULL DEFAULT 'OPERATIONS',
  "status" "PlatformAdminStatus" NOT NULL DEFAULT 'ACTIVE',
  "department" VARCHAR(100),
  "last_login_at" TIMESTAMPTZ(6),
  "created_by_admin_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "platform_admins_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "platform_admins_email_key" ON "platform_admins" ("email");
CREATE INDEX IF NOT EXISTS "platform_admins_role_status_idx" ON "platform_admins" ("role", "status");

CREATE TABLE IF NOT EXISTS "platform_admin_sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "admin_id" UUID NOT NULL,
  "token_hash" VARCHAR(255) NOT NULL,
  "ip_address" VARCHAR(45),
  "user_agent" TEXT,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "revoked_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "platform_admin_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "platform_admin_sessions_admin_id_fkey"
    FOREIGN KEY ("admin_id") REFERENCES "platform_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "platform_admin_sessions_token_hash_key" ON "platform_admin_sessions" ("token_hash");
CREATE INDEX IF NOT EXISTS "platform_admin_sessions_admin_id_idx" ON "platform_admin_sessions" ("admin_id");
CREATE INDEX IF NOT EXISTS "platform_admin_sessions_expires_at_idx" ON "platform_admin_sessions" ("expires_at");

ALTER TABLE "platform_admins" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'platform_admins'
      AND policyname = 'platform_admin_only_admins'
  ) THEN
    CREATE POLICY "platform_admin_only_admins" ON "platform_admins"
      AS PERMISSIVE FOR ALL
      USING (current_setting('app.platform_admin', true) = 'true')
      WITH CHECK (current_setting('app.platform_admin', true) = 'true');
  END IF;
END $$;

ALTER TABLE "platform_admin_sessions" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'platform_admin_sessions'
      AND policyname = 'platform_admin_only_sessions'
  ) THEN
    CREATE POLICY "platform_admin_only_sessions" ON "platform_admin_sessions"
      AS PERMISSIVE FOR ALL
      USING (current_setting('app.platform_admin', true) = 'true')
      WITH CHECK (current_setting('app.platform_admin', true) = 'true');
  END IF;
END $$;
