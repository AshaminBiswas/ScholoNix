-- =============================================================================
-- Company Super-Admin Platform Migration (Additive & Idempotent)
-- =============================================================================

ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';

DO $$ BEGIN
  CREATE TYPE "SaaSPlan" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SaaSBillingCycle" AS ENUM ('MONTHLY', 'YEARLY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SaaSSubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PlatformInvoiceStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'VOID');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PlatformTicketSource" AS ENUM ('CONTACT_FORM', 'FEEDBACK_FORM', 'PORTAL_SUPPORT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PlatformTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PlatformTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PlatformAnnouncementSeverity" AS ENUM ('INFO', 'WARNING', 'MAINTENANCE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "schools"
  ADD COLUMN IF NOT EXISTS "plan" "SaaSPlan" NOT NULL DEFAULT 'STARTER',
  ADD COLUMN IF NOT EXISTS "billing_cycle" "SaaSBillingCycle" NOT NULL DEFAULT 'MONTHLY',
  ADD COLUMN IF NOT EXISTS "subscription_status" "SaaSSubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
  ADD COLUMN IF NOT EXISTS "max_students_limit" INTEGER NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS "max_staff_limit" INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS "enabled_modules" JSONB,
  ADD COLUMN IF NOT EXISTS "suspended_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "internal_notes" TEXT;

CREATE INDEX IF NOT EXISTS "schools_plan_idx" ON "schools" ("plan");

CREATE TABLE IF NOT EXISTS "platform_subscription_invoices" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "invoice_number" VARCHAR(40) NOT NULL,
  "idempotency_key" VARCHAR(80) NOT NULL,
  "plan" "SaaSPlan" NOT NULL,
  "billing_cycle" "SaaSBillingCycle" NOT NULL,
  "amount_paise" INTEGER NOT NULL,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
  "period_start" TIMESTAMPTZ(6) NOT NULL,
  "period_end" TIMESTAMPTZ(6) NOT NULL,
  "status" "PlatformInvoiceStatus" NOT NULL DEFAULT 'PENDING',
  "payment_mode" VARCHAR(40),
  "payment_reference" VARCHAR(120),
  "paid_at" TIMESTAMPTZ(6),
  "notes" TEXT,
  "created_by_user_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "platform_subscription_invoices_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "platform_subscription_invoices_school_id_fkey"
    FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "platform_subscription_invoices_invoice_number_key"
  ON "platform_subscription_invoices" ("invoice_number");
CREATE UNIQUE INDEX IF NOT EXISTS "platform_subscription_invoices_idempotency_key_key"
  ON "platform_subscription_invoices" ("idempotency_key");
CREATE INDEX IF NOT EXISTS "platform_subscription_invoices_school_status_idx"
  ON "platform_subscription_invoices" ("school_id", "status", "created_at");

CREATE TABLE IF NOT EXISTS "platform_support_tickets" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "reference_code" VARCHAR(40) NOT NULL,
  "source" "PlatformTicketSource" NOT NULL,
  "school_id" UUID,
  "user_id" UUID,
  "sender_name" VARCHAR(150) NOT NULL,
  "sender_email" VARCHAR(255),
  "sender_phone" VARCHAR(30),
  "school_name" VARCHAR(200),
  "role" VARCHAR(100),
  "category" VARCHAR(100) NOT NULL,
  "subject" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "rating" INTEGER,
  "sentiment" VARCHAR(30),
  "module" VARCHAR(100),
  "status" "PlatformTicketStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "PlatformTicketPriority" NOT NULL DEFAULT 'MEDIUM',
  "resolution_notes" TEXT,
  "resolved_by_user_id" UUID,
  "resolved_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "platform_support_tickets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "platform_support_tickets_school_id_fkey"
    FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "platform_support_tickets_reference_code_key"
  ON "platform_support_tickets" ("reference_code");
CREATE INDEX IF NOT EXISTS "platform_support_tickets_status_priority_idx"
  ON "platform_support_tickets" ("status", "priority", "created_at");
CREATE INDEX IF NOT EXISTS "platform_support_tickets_school_idx"
  ON "platform_support_tickets" ("school_id", "created_at");

CREATE TABLE IF NOT EXISTS "platform_announcements" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" VARCHAR(200) NOT NULL,
  "message" TEXT NOT NULL,
  "severity" "PlatformAnnouncementSeverity" NOT NULL DEFAULT 'INFO',
  "target_plan" "SaaSPlan",
  "target_school_id" UUID,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "starts_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ends_at" TIMESTAMPTZ(6),
  "created_by_user_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "platform_announcements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "platform_announcements_target_school_id_fkey"
    FOREIGN KEY ("target_school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "platform_announcements_active_window_idx"
  ON "platform_announcements" ("is_active", "starts_at", "ends_at");

ALTER TABLE "platform_subscription_invoices" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'platform_subscription_invoices'
      AND policyname = 'platform_admin_only_invoices'
  ) THEN
    CREATE POLICY "platform_admin_only_invoices" ON "platform_subscription_invoices"
      AS PERMISSIVE FOR ALL
      USING (current_setting('app.platform_admin', true) = 'true')
      WITH CHECK (current_setting('app.platform_admin', true) = 'true');
  END IF;
END $$;

ALTER TABLE "platform_support_tickets" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'platform_support_tickets'
      AND policyname = 'platform_admin_only_tickets'
  ) THEN
    CREATE POLICY "platform_admin_only_tickets" ON "platform_support_tickets"
      AS PERMISSIVE FOR ALL
      USING (current_setting('app.platform_admin', true) = 'true')
      WITH CHECK (current_setting('app.platform_admin', true) = 'true');
  END IF;
END $$;

ALTER TABLE "platform_announcements" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'platform_announcements'
      AND policyname = 'platform_admin_only_announcements'
  ) THEN
    CREATE POLICY "platform_admin_only_announcements" ON "platform_announcements"
      AS PERMISSIVE FOR ALL
      USING (current_setting('app.platform_admin', true) = 'true')
      WITH CHECK (current_setting('app.platform_admin', true) = 'true');
  END IF;
END $$;
