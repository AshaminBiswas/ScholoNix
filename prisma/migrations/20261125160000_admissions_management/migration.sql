-- Additive PostgreSQL migration for multi-tenant Admissions Management tables and RLS policies

DO $$ BEGIN
  CREATE TYPE "AdmissionEnquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'FOLLOW_UP', 'CONVERTED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AdmissionApplicationStatus" AS ENUM ('UNDER_REVIEW', 'DOCUMENTS_PENDING', 'SHORTLISTED', 'ADMITTED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DocumentVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AdmissionReminderPriority" AS ENUM ('INFO', 'WARNING');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "admission_settings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "current_academic_year" VARCHAR(30) NOT NULL,
  "application_deadline" TIMESTAMPTZ(6),
  "application_prefix" VARCHAR(16) NOT NULL DEFAULT 'APP',
  "next_application_seq" INTEGER NOT NULL DEFAULT 1,
  "next_enquiry_seq" INTEGER NOT NULL DEFAULT 1,
  "next_admission_seq" INTEGER NOT NULL DEFAULT 1,
  "enabled_grades" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admission_settings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admission_settings_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "admission_settings_school_id_key" ON "admission_settings"("school_id");

CREATE TABLE IF NOT EXISTS "admission_enquiries" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "enquiry_code" VARCHAR(40) NOT NULL,
  "student_name" VARCHAR(255) NOT NULL,
  "guardian_name" VARCHAR(255) NOT NULL,
  "guardian_phone" VARCHAR(30) NOT NULL,
  "guardian_email" VARCHAR(255),
  "grade_applied" VARCHAR(60) NOT NULL,
  "academic_year" VARCHAR(30) NOT NULL,
  "source" VARCHAR(60) NOT NULL DEFAULT 'Walk-In',
  "status" "AdmissionEnquiryStatus" NOT NULL DEFAULT 'NEW',
  "notes" TEXT,
  "converted_application_id" UUID,
  "created_by_user_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admission_enquiries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admission_enquiries_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "admission_enquiries_school_id_enquiry_code_key" ON "admission_enquiries"("school_id", "enquiry_code");
CREATE INDEX IF NOT EXISTS "admission_enquiries_school_id_academic_year_status_created_at_idx" ON "admission_enquiries"("school_id", "academic_year", "status", "created_at");

CREATE TABLE IF NOT EXISTS "admission_applications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "application_code" VARCHAR(40) NOT NULL,
  "admission_number" VARCHAR(40),
  "enquiry_id" UUID,
  "student_name" VARCHAR(255) NOT NULL,
  "gender" VARCHAR(30),
  "date_of_birth" DATE,
  "grade_applied" VARCHAR(60) NOT NULL,
  "academic_year" VARCHAR(30) NOT NULL,
  "guardian_name" VARCHAR(255) NOT NULL,
  "guardian_relation" VARCHAR(60) NOT NULL DEFAULT 'Parent',
  "guardian_phone" VARCHAR(30) NOT NULL,
  "guardian_email" VARCHAR(255),
  "previous_school" VARCHAR(255),
  "status" "AdmissionApplicationStatus" NOT NULL DEFAULT 'UNDER_REVIEW',
  "verification_status" "DocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
  "verification_notes" TEXT,
  "documents_checklist" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "shortlisted_at" TIMESTAMPTZ(6),
  "admitted_at" TIMESTAMPTZ(6),
  "rejected_at" TIMESTAMPTZ(6),
  "verified_at" TIMESTAMPTZ(6),
  "reviewed_by_user_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admission_applications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admission_applications_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "admission_applications_school_id_application_code_key" ON "admission_applications"("school_id", "application_code");
CREATE UNIQUE INDEX IF NOT EXISTS "admission_applications_school_id_admission_number_key" ON "admission_applications"("school_id", "admission_number");
CREATE INDEX IF NOT EXISTS "admission_applications_school_id_academic_year_status_applied_at_idx" ON "admission_applications"("school_id", "academic_year", "status", "applied_at");
CREATE INDEX IF NOT EXISTS "admission_applications_school_id_academic_year_grade_applied_idx" ON "admission_applications"("school_id", "academic_year", "grade_applied");
CREATE INDEX IF NOT EXISTS "admission_applications_school_id_applied_at_idx" ON "admission_applications"("school_id", "applied_at");

CREATE TABLE IF NOT EXISTS "admission_reminders" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "academic_year" VARCHAR(30),
  "due_date" TIMESTAMPTZ(6),
  "priority" "AdmissionReminderPriority" NOT NULL DEFAULT 'INFO',
  "is_completed" BOOLEAN NOT NULL DEFAULT false,
  "created_by_user_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admission_reminders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admission_reminders_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "admission_reminders_school_id_academic_year_is_completed_created_at_idx" ON "admission_reminders"("school_id", "academic_year", "is_completed", "created_at");

CREATE TABLE IF NOT EXISTS "admission_activities" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "application_id" UUID,
  "enquiry_id" UUID,
  "actor_id" UUID,
  "actor_name" VARCHAR(255) NOT NULL,
  "action" VARCHAR(80) NOT NULL,
  "summary" VARCHAR(500) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admission_activities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admission_activities_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "admission_activities_school_id_created_at_idx" ON "admission_activities"("school_id", "created_at");

-- Row-Level Security policies for defense-in-depth multi-tenant isolation
ALTER TABLE "admission_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admission_enquiries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admission_applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admission_reminders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admission_activities" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_admission_settings" ON "admission_settings";
CREATE POLICY "tenant_isolation_admission_settings" ON "admission_settings"
  USING ("school_id" = NULLIF(current_setting('app.current_school_id', true), '')::uuid)
  WITH CHECK ("school_id" = NULLIF(current_setting('app.current_school_id', true), '')::uuid);

DROP POLICY IF EXISTS "tenant_isolation_admission_enquiries" ON "admission_enquiries";
CREATE POLICY "tenant_isolation_admission_enquiries" ON "admission_enquiries"
  USING ("school_id" = NULLIF(current_setting('app.current_school_id', true), '')::uuid)
  WITH CHECK ("school_id" = NULLIF(current_setting('app.current_school_id', true), '')::uuid);

DROP POLICY IF EXISTS "tenant_isolation_admission_applications" ON "admission_applications";
CREATE POLICY "tenant_isolation_admission_applications" ON "admission_applications"
  USING ("school_id" = NULLIF(current_setting('app.current_school_id', true), '')::uuid)
  WITH CHECK ("school_id" = NULLIF(current_setting('app.current_school_id', true), '')::uuid);

DROP POLICY IF EXISTS "tenant_isolation_admission_reminders" ON "admission_reminders";
CREATE POLICY "tenant_isolation_admission_reminders" ON "admission_reminders"
  USING ("school_id" = NULLIF(current_setting('app.current_school_id', true), '')::uuid)
  WITH CHECK ("school_id" = NULLIF(current_setting('app.current_school_id', true), '')::uuid);

DROP POLICY IF EXISTS "tenant_isolation_admission_activities" ON "admission_activities";
CREATE POLICY "tenant_isolation_admission_activities" ON "admission_activities"
  USING ("school_id" = NULLIF(current_setting('app.current_school_id', true), '')::uuid)
  WITH CHECK ("school_id" = NULLIF(current_setting('app.current_school_id', true), '')::uuid);
