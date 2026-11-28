-- Academics: Sessions, Classes, Sections & Subjects Tree Migration (Idempotent & Supabase-safe)

CREATE TABLE IF NOT EXISTS "academic_sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "name" VARCHAR(30) NOT NULL,
  "start_date" DATE,
  "end_date" DATE,
  "is_current" BOOLEAN NOT NULL DEFAULT false,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "academic_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "academic_sessions_school_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE,
  CONSTRAINT "academic_sessions_unique" UNIQUE ("school_id", "name")
);

CREATE INDEX IF NOT EXISTS "idx_academic_sessions_lookup" ON "academic_sessions"("school_id", "is_current", "status");

CREATE TABLE IF NOT EXISTS "academic_classes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "academic_year" VARCHAR(30) NOT NULL,
  "name" VARCHAR(60) NOT NULL,
  "code" VARCHAR(30),
  "department" VARCHAR(60) DEFAULT 'General',
  "display_order" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "academic_classes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "academic_classes_school_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE,
  CONSTRAINT "academic_classes_unique" UNIQUE ("school_id", "academic_year", "name")
);

CREATE INDEX IF NOT EXISTS "idx_academic_classes_order" ON "academic_classes"("school_id", "academic_year", "display_order");

CREATE TABLE IF NOT EXISTS "academic_sections" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "class_id" UUID NOT NULL,
  "academic_year" VARCHAR(30) NOT NULL,
  "name" VARCHAR(20) NOT NULL,
  "capacity" INTEGER NOT NULL DEFAULT 40,
  "room_number" VARCHAR(40),
  "class_teacher_name" VARCHAR(150),
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "academic_sections_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "academic_sections_school_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE,
  CONSTRAINT "academic_sections_class_fkey" FOREIGN KEY ("class_id") REFERENCES "academic_classes"("id") ON DELETE CASCADE,
  CONSTRAINT "academic_sections_unique" UNIQUE ("school_id", "class_id", "name")
);

CREATE INDEX IF NOT EXISTS "idx_academic_sections_lookup" ON "academic_sections"("school_id", "academic_year", "class_id");

CREATE TABLE IF NOT EXISTS "academic_subjects" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "code" VARCHAR(30) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "category" VARCHAR(30) NOT NULL DEFAULT 'CORE',
  "default_max_marks" INTEGER NOT NULL DEFAULT 100,
  "default_pass_marks" INTEGER NOT NULL DEFAULT 33,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "academic_subjects_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "academic_subjects_school_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE,
  CONSTRAINT "academic_subjects_unique" UNIQUE ("school_id", "code")
);

CREATE INDEX IF NOT EXISTS "idx_academic_subjects_lookup" ON "academic_subjects"("school_id", "status", "category");

CREATE TABLE IF NOT EXISTS "class_subject_assignments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "class_id" UUID NOT NULL,
  "subject_id" UUID NOT NULL,
  "academic_year" VARCHAR(30) NOT NULL,
  "teacher_name" VARCHAR(150),
  "weekly_periods" INTEGER NOT NULL DEFAULT 5,
  "max_marks" INTEGER NOT NULL DEFAULT 100,
  "pass_marks" INTEGER NOT NULL DEFAULT 33,
  "is_compulsory" BOOLEAN NOT NULL DEFAULT true,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "class_subject_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "class_subject_assignments_school_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE,
  CONSTRAINT "class_subject_assignments_class_fkey" FOREIGN KEY ("class_id") REFERENCES "academic_classes"("id") ON DELETE CASCADE,
  CONSTRAINT "class_subject_assignments_subject_fkey" FOREIGN KEY ("subject_id") REFERENCES "academic_subjects"("id") ON DELETE CASCADE,
  CONSTRAINT "class_subject_assignments_unique" UNIQUE ("school_id", "class_id", "subject_id")
);

CREATE INDEX IF NOT EXISTS "idx_csa_lookup" ON "class_subject_assignments"("school_id", "academic_year", "class_id");

-- Tenant Isolation RLS (Idempotent, DROP-free)
DO $$
DECLARE
  tbl TEXT;
  policy_exists BOOLEAN;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'academic_sessions',
      'academic_classes',
      'academic_sections',
      'academic_subjects',
      'class_subject_assignments'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    SELECT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl AND policyname = 'tenant_isolation_policy'
    ) INTO policy_exists;
    IF NOT policy_exists THEN
      EXECUTE format(
        'CREATE POLICY tenant_isolation_policy ON %I USING (
          school_id = NULLIF(current_setting(''app.current_school_id'', true), '''')::uuid
          OR COALESCE(current_setting(''app.platform_admin'', true), '''') = ''true''
        ) WITH CHECK (
          school_id = NULLIF(current_setting(''app.current_school_id'', true), '''')::uuid
          OR COALESCE(current_setting(''app.platform_admin'', true), '''') = ''true''
        )',
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- Idempotent Backfill from existing students & enrollments
INSERT INTO "academic_sessions" ("school_id", "name", "is_current", "status")
SELECT DISTINCT s."school_id", s."current_academic_year", true, 'ACTIVE'
FROM "students" s
WHERE NULLIF(trim(s."current_academic_year"), '') IS NOT NULL
ON CONFLICT ("school_id", "name") DO NOTHING;

INSERT INTO "academic_classes" ("school_id", "academic_year", "name", "display_order", "status")
SELECT DISTINCT
  s."school_id",
  s."current_academic_year",
  s."current_grade",
  1,
  'ACTIVE'
FROM "students" s
WHERE NULLIF(trim(s."current_grade"), '') IS NOT NULL
  AND NULLIF(trim(s."current_academic_year"), '') IS NOT NULL
ON CONFLICT ("school_id", "academic_year", "name") DO NOTHING;

INSERT INTO "academic_sections" ("school_id", "class_id", "academic_year", "name", "capacity", "status")
SELECT DISTINCT
  s."school_id",
  ac."id",
  s."current_academic_year",
  COALESCE(NULLIF(trim(s."current_section"), ''), 'A'),
  40,
  'ACTIVE'
FROM "students" s
JOIN "academic_classes" ac
  ON ac."school_id" = s."school_id"
 AND ac."academic_year" = s."current_academic_year"
 AND ac."name" = s."current_grade"
ON CONFLICT ("school_id", "class_id", "name") DO NOTHING;
