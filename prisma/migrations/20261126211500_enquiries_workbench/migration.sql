-- =============================================================================
-- Enquiries Workbench Migration (Additive + Tenant RLS Policies)
-- =============================================================================

ALTER TABLE "admission_enquiries"
  ADD COLUMN IF NOT EXISTS "enquiry_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "student_dob" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "student_gender" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "guardian_relation" VARCHAR(60),
  ADD COLUMN IF NOT EXISTS "address_line_1" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "address_line_2" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "city" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "state" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "pin_code" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "enquiry_type" VARCHAR(60) NOT NULL DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS "assigned_to_user_id" UUID,
  ADD COLUMN IF NOT EXISTS "assigned_to_name" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "next_follow_up_at" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "has_siblings_in_school" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "interested_in_transport" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "interested_in_hostel" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "requires_special_support" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "is_draft" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "admission_enquiries_school_draft_updated_idx"
  ON "admission_enquiries" ("school_id", "is_draft", "updated_at");

CREATE TABLE IF NOT EXISTS "admission_enquiry_sources" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "name" VARCHAR(80) NOT NULL,
  "description" VARCHAR(255),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "color_token" VARCHAR(32) NOT NULL DEFAULT 'violet',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "admission_enquiry_sources_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admission_enquiry_sources_school_id_fkey"
    FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "admission_enquiry_sources_school_name_key"
  ON "admission_enquiry_sources" ("school_id", "name");

CREATE INDEX IF NOT EXISTS "admission_enquiry_sources_school_active_idx"
  ON "admission_enquiry_sources" ("school_id", "is_active");

CREATE TABLE IF NOT EXISTS "admission_enquiry_follow_ups" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "enquiry_id" UUID NOT NULL,
  "follow_up_type" VARCHAR(40) NOT NULL,
  "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
  "completed_at" TIMESTAMPTZ(6),
  "status" VARCHAR(30) NOT NULL DEFAULT 'UPCOMING',
  "assigned_to_user_id" UUID,
  "assigned_to_name" VARCHAR(255),
  "notes" TEXT NOT NULL,
  "outcome" TEXT,
  "created_by_user_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "admission_enquiry_follow_ups_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admission_enquiry_follow_ups_school_id_fkey"
    FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "admission_enquiry_follow_ups_enquiry_id_fkey"
    FOREIGN KEY ("enquiry_id") REFERENCES "admission_enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "admission_enquiry_follow_ups_school_enq_sched_idx"
  ON "admission_enquiry_follow_ups" ("school_id", "enquiry_id", "scheduled_at");

CREATE INDEX IF NOT EXISTS "admission_enquiry_follow_ups_school_status_sched_idx"
  ON "admission_enquiry_follow_ups" ("school_id", "status", "scheduled_at");

CREATE TABLE IF NOT EXISTS "admission_enquiry_communications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "enquiry_id" UUID NOT NULL,
  "channel" VARCHAR(30) NOT NULL,
  "recipient" VARCHAR(255) NOT NULL,
  "cc" VARCHAR(255),
  "bcc" VARCHAR(255),
  "subject" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "attachments" JSONB,
  "status" VARCHAR(30) NOT NULL DEFAULT 'SENT',
  "sent_by_user_id" UUID,
  "sent_by_name" VARCHAR(255) NOT NULL,
  "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "admission_enquiry_communications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admission_enquiry_communications_school_id_fkey"
    FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "admission_enquiry_communications_enquiry_id_fkey"
    FOREIGN KEY ("enquiry_id") REFERENCES "admission_enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "admission_enquiry_communications_school_enq_sent_idx"
  ON "admission_enquiry_communications" ("school_id", "enquiry_id", "sent_at");

CREATE TABLE IF NOT EXISTS "admission_enquiry_notes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "enquiry_id" UUID NOT NULL,
  "category" VARCHAR(60) NOT NULL DEFAULT 'Admission Related',
  "title" VARCHAR(180) NOT NULL,
  "content" TEXT NOT NULL,
  "created_by_user_id" UUID,
  "created_by_name" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "admission_enquiry_notes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admission_enquiry_notes_school_id_fkey"
    FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "admission_enquiry_notes_enquiry_id_fkey"
    FOREIGN KEY ("enquiry_id") REFERENCES "admission_enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "admission_enquiry_notes_school_enq_created_idx"
  ON "admission_enquiry_notes" ("school_id", "enquiry_id", "created_at");

-- Row Level Security (RLS) Tenant Isolation Policies (idempotent without DROP)
ALTER TABLE "admission_enquiry_sources" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admission_enquiry_sources'
      AND policyname = 'tenant_isolation_admission_enquiry_sources'
  ) THEN
    CREATE POLICY "tenant_isolation_admission_enquiry_sources" ON "admission_enquiry_sources"
      AS PERMISSIVE FOR ALL
      USING (school_id = NULLIF(current_setting('app.current_school_id', true), '')::uuid)
      WITH CHECK (school_id = NULLIF(current_setting('app.current_school_id', true), '')::uuid);
  END IF;
END $$;

ALTER TABLE "admission_enquiry_follow_ups" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admission_enquiry_follow_ups'
      AND policyname = 'tenant_isolation_admission_enquiry_follow_ups'
  ) THEN
    CREATE POLICY "tenant_isolation_admission_enquiry_follow_ups" ON "admission_enquiry_follow_ups"
      AS PERMISSIVE FOR ALL
      USING (school_id = NULLIF(current_setting('app.current_school_id', true), '')::uuid)
      WITH CHECK (school_id = NULLIF(current_setting('app.current_school_id', true), '')::uuid);
  END IF;
END $$;

ALTER TABLE "admission_enquiry_communications" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admission_enquiry_communications'
      AND policyname = 'tenant_isolation_admission_enquiry_communications'
  ) THEN
    CREATE POLICY "tenant_isolation_admission_enquiry_communications" ON "admission_enquiry_communications"
      AS PERMISSIVE FOR ALL
      USING (school_id = NULLIF(current_setting('app.current_school_id', true), '')::uuid)
      WITH CHECK (school_id = NULLIF(current_setting('app.current_school_id', true), '')::uuid);
  END IF;
END $$;

ALTER TABLE "admission_enquiry_notes" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admission_enquiry_notes'
      AND policyname = 'tenant_isolation_admission_enquiry_notes'
  ) THEN
    CREATE POLICY "tenant_isolation_admission_enquiry_notes" ON "admission_enquiry_notes"
      AS PERMISSIVE FOR ALL
      USING (school_id = NULLIF(current_setting('app.current_school_id', true), '')::uuid)
      WITH CHECK (school_id = NULLIF(current_setting('app.current_school_id', true), '')::uuid);
  END IF;
END $$;
