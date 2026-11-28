-- Additive non-destructive migration for Student Lifecycle Management Suite
-- Supports Student Dashboard, Student List, Enrolment, Promotion, Transfer, Inactive, Alumni, Groups, ID Cards & Settings

DO $$ BEGIN
  CREATE TYPE "StudentLifecycleStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'ALUMNI', 'WITHDRAWN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StudentEnrollmentStatus" AS ENUM ('ENROLLED', 'PROMOTED', 'RETAINED', 'TRANSFERRED_OUT', 'GRADUATED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StudentTransferType" AS ENUM ('TRANSFER_IN', 'TRANSFER_OUT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "students" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "application_id" UUID,
  "user_id" UUID,
  "admission_number" VARCHAR(40) NOT NULL,
  "student_id_number" VARCHAR(60),
  "student_name" VARCHAR(255) NOT NULL,
  "gender" VARCHAR(30),
  "date_of_birth" DATE,
  "blood_group" VARCHAR(20),
  "nationality" VARCHAR(80),
  "photo_key" VARCHAR(500),
  "email" VARCHAR(255),
  "phone" VARCHAR(30),
  "address_json" JSONB,
  "guardian_name" VARCHAR(255) NOT NULL,
  "guardian_relation" VARCHAR(60) NOT NULL DEFAULT 'Parent',
  "guardian_phone" VARCHAR(30) NOT NULL,
  "guardian_email" VARCHAR(255),
  "guardian_details" JSONB,
  "previous_school" VARCHAR(255),
  "academic_details" JSONB,
  "medical_notes" TEXT,
  "admission_type" "AdmissionType" NOT NULL DEFAULT 'FRESH',
  "admission_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "StudentLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
  "current_academic_year" VARCHAR(30) NOT NULL,
  "current_grade" VARCHAR(60) NOT NULL,
  "current_section" VARCHAR(20) NOT NULL DEFAULT 'A',
  "current_roll_number" VARCHAR(30),
  "graduation_year" VARCHAR(30),
  "inactive_reason" VARCHAR(255),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "students_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "students_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "students_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "students_application_id_key" ON "students"("application_id");
CREATE UNIQUE INDEX IF NOT EXISTS "students_school_id_admission_number_key" ON "students"("school_id", "admission_number");
CREATE INDEX IF NOT EXISTS "students_school_id_status_current_grade_current_section_idx" ON "students"("school_id", "status", "current_grade", "current_section");
CREATE INDEX IF NOT EXISTS "students_school_id_current_academic_year_current_grade_idx" ON "students"("school_id", "current_academic_year", "current_grade");
CREATE INDEX IF NOT EXISTS "students_school_id_admission_date_idx" ON "students"("school_id", "admission_date");

CREATE TABLE IF NOT EXISTS "student_enrollments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "academic_year" VARCHAR(30) NOT NULL,
  "grade" VARCHAR(60) NOT NULL,
  "section" VARCHAR(20) NOT NULL DEFAULT 'A',
  "roll_number" VARCHAR(30),
  "status" "StudentEnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
  "is_current" BOOLEAN NOT NULL DEFAULT true,
  "promoted_from_enrollment_id" UUID,
  "remarks" VARCHAR(255),
  "effective_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "effective_to" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_enrollments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_enrollments_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "student_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "student_enrollments_school_id_student_id_academic_year_key" ON "student_enrollments"("school_id", "student_id", "academic_year");
CREATE INDEX IF NOT EXISTS "student_enrollments_school_id_academic_year_grade_section_idx" ON "student_enrollments"("school_id", "academic_year", "grade", "section");
CREATE INDEX IF NOT EXISTS "student_enrollments_student_id_is_current_idx" ON "student_enrollments"("student_id", "is_current");

CREATE TABLE IF NOT EXISTS "student_transfers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "transfer_type" "StudentTransferType" NOT NULL,
  "transfer_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tc_number" VARCHAR(60),
  "counterparty_school" VARCHAR(255),
  "reason" TEXT,
  "clearance_status" VARCHAR(30) NOT NULL DEFAULT 'CLEARED',
  "from_grade" VARCHAR(60),
  "to_grade" VARCHAR(60),
  "processed_by_user_id" UUID,
  "processed_by_name" VARCHAR(255),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_transfers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_transfers_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "student_transfers_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "student_transfers_school_id_transfer_date_idx" ON "student_transfers"("school_id", "transfer_date");
CREATE INDEX IF NOT EXISTS "student_transfers_student_id_idx" ON "student_transfers"("student_id");

CREATE TABLE IF NOT EXISTS "student_groups" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "category" VARCHAR(60) NOT NULL DEFAULT 'General',
  "color_token" VARCHAR(30) NOT NULL DEFAULT 'violet',
  "description" VARCHAR(255),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_groups_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_groups_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "student_groups_school_id_name_key" ON "student_groups"("school_id", "name");
CREATE INDEX IF NOT EXISTS "student_groups_school_id_category_idx" ON "student_groups"("school_id", "category");

CREATE TABLE IF NOT EXISTS "student_group_members" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "group_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_group_members_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "student_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "student_group_members_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "student_group_members_group_id_student_id_key" ON "student_group_members"("group_id", "student_id");
CREATE INDEX IF NOT EXISTS "student_group_members_school_id_group_id_idx" ON "student_group_members"("school_id", "group_id");
CREATE INDEX IF NOT EXISTS "student_group_members_school_id_student_id_idx" ON "student_group_members"("school_id", "student_id");

CREATE TABLE IF NOT EXISTS "student_activities" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID,
  "actor_id" UUID,
  "actor_name" VARCHAR(255) NOT NULL,
  "action_type" VARCHAR(60) NOT NULL,
  "summary" VARCHAR(500) NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_activities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_activities_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "student_activities_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "student_activities_school_id_created_at_idx" ON "student_activities"("school_id", "created_at");
CREATE INDEX IF NOT EXISTS "student_activities_school_id_student_id_created_at_idx" ON "student_activities"("school_id", "student_id", "created_at");

CREATE TABLE IF NOT EXISTS "student_settings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "default_sections" TEXT[] NOT NULL DEFAULT ARRAY['A', 'B', 'C']::TEXT[],
  "sections_by_grade" JSONB,
  "roll_number_mode" VARCHAR(30) NOT NULL DEFAULT 'AUTO_ALPHA',
  "require_tc_on_transfer" BOOLEAN NOT NULL DEFAULT true,
  "id_card_config" JSONB,
  "promotion_config" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_settings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_settings_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "student_settings_school_id_key" ON "student_settings"("school_id");

-- Defense-in-depth Multi-Tenant Row-Level Security
ALTER TABLE "students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "student_enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "student_transfers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "student_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "student_group_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "student_activities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "student_settings" ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'students',
    'student_enrollments',
    'student_transfers',
    'student_groups',
    'student_group_members',
    'student_activities',
    'student_settings'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_%I" ON %I;', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "tenant_isolation_%I" ON %I USING ("school_id" = NULLIF(current_setting(''app.current_school_id'', true), '''')::uuid OR current_setting(''app.platform_admin'', true) = ''true'') WITH CHECK ("school_id" = NULLIF(current_setting(''app.current_school_id'', true), '''')::uuid OR current_setting(''app.platform_admin'', true) = ''true'');',
      tbl, tbl
    );
  END LOOP;
END $$;

-- Idempotent non-destructive backfill for existing admitted students
INSERT INTO "students" (
  "school_id", "application_id", "admission_number", "student_id_number", "student_name",
  "gender", "date_of_birth", "blood_group", "nationality", "photo_key", "email", "phone",
  "address_json", "guardian_name", "guardian_relation", "guardian_phone", "guardian_email",
  "guardian_details", "previous_school", "academic_details", "admission_type", "admission_date",
  "status", "current_academic_year", "current_grade", "current_section"
)
SELECT
  a."school_id",
  a."id",
  COALESCE(a."admission_number", a."application_code"),
  a."student_id_number",
  a."student_name",
  a."gender",
  a."date_of_birth",
  a."blood_group",
  a."nationality",
  a."student_photo_key",
  a."student_details"->>'email',
  a."student_details"->>'phone',
  a."student_details"->'address',
  a."guardian_name",
  a."guardian_relation",
  a."guardian_phone",
  a."guardian_email",
  a."guardian_details",
  a."previous_school",
  a."academic_details",
  a."admission_type",
  COALESCE(a."admitted_at", a."applied_at"),
  CASE
    WHEN a."enrollment_status" = 'TRANSFERRED' THEN 'TRANSFERRED'::"StudentLifecycleStatus"
    WHEN a."enrollment_status" = 'WITHDRAWN' THEN 'INACTIVE'::"StudentLifecycleStatus"
    ELSE 'ACTIVE'::"StudentLifecycleStatus"
  END,
  a."academic_year",
  a."grade_applied",
  'A'
FROM "admission_applications" a
WHERE a."status" = 'ADMITTED'
  AND NOT EXISTS (
    SELECT 1 FROM "students" s
    WHERE s."application_id" = a."id"
       OR (s."school_id" = a."school_id" AND s."admission_number" = COALESCE(a."admission_number", a."application_code"))
  );

INSERT INTO "student_enrollments" (
  "school_id", "student_id", "academic_year", "grade", "section", "status", "is_current", "effective_from"
)
SELECT
  s."school_id",
  s."id",
  s."current_academic_year",
  s."current_grade",
  s."current_section",
  CASE
    WHEN s."status" = 'TRANSFERRED' THEN 'TRANSFERRED_OUT'::"StudentEnrollmentStatus"
    WHEN s."status" = 'ALUMNI' THEN 'GRADUATED'::"StudentEnrollmentStatus"
    ELSE 'ENROLLED'::"StudentEnrollmentStatus"
  END,
  true,
  s."admission_date"
FROM "students" s
WHERE NOT EXISTS (
  SELECT 1 FROM "student_enrollments" e
  WHERE e."school_id" = s."school_id"
    AND e."student_id" = s."id"
    AND e."academic_year" = s."current_academic_year"
);
