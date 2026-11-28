-- Student Promotion Suite & Performance Indexes Migration
CREATE TABLE IF NOT EXISTS "student_promotion_rules" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "academic_year" VARCHAR(30) NOT NULL,
  "from_grade" VARCHAR(60) NOT NULL,
  "to_grade" VARCHAR(60) NOT NULL,
  "mark_as_alumni" BOOLEAN NOT NULL DEFAULT false,
  "default_section_mode" VARCHAR(30) NOT NULL DEFAULT 'KEEP_SAME',
  "target_section" VARCHAR(20),
  "min_result_pct" DOUBLE PRECISION NOT NULL DEFAULT 35,
  "min_attendance_pct" DOUBLE PRECISION NOT NULL DEFAULT 75,
  "max_failed_subjects" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_promotion_rules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_promotion_rules_school_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE,
  CONSTRAINT "student_promotion_rules_unique" UNIQUE ("school_id", "academic_year", "from_grade")
);
CREATE INDEX IF NOT EXISTS "idx_promo_rules_lookup" ON "student_promotion_rules"("school_id", "academic_year", "is_active");

CREATE TABLE IF NOT EXISTS "student_promotion_batches" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "academic_year" VARCHAR(30) NOT NULL,
  "to_academic_year" VARCHAR(30) NOT NULL,
  "from_grade" VARCHAR(60),
  "to_grade" VARCHAR(60),
  "total_eligible" INTEGER NOT NULL DEFAULT 0,
  "promoted_count" INTEGER NOT NULL DEFAULT 0,
  "retained_count" INTEGER NOT NULL DEFAULT 0,
  "pending_count" INTEGER NOT NULL DEFAULT 0,
  "alumni_count" INTEGER NOT NULL DEFAULT 0,
  "status" VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
  "triggered_by_name" VARCHAR(150) NOT NULL,
  "completed_at" TIMESTAMPTZ(6),
  "remarks" VARCHAR(255),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_promotion_batches_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_promotion_batches_school_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_promo_batches_history" ON "student_promotion_batches"("school_id", "academic_year", "completed_at");
CREATE INDEX IF NOT EXISTS "idx_promo_batches_grades" ON "student_promotion_batches"("school_id", "from_grade", "to_grade");

CREATE TABLE IF NOT EXISTS "student_promotion_decisions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "batch_id" UUID,
  "student_id" UUID NOT NULL,
  "academic_year" VARCHAR(30) NOT NULL,
  "from_grade" VARCHAR(60) NOT NULL,
  "from_section" VARCHAR(20) NOT NULL,
  "to_grade" VARCHAR(60) NOT NULL,
  "to_section" VARCHAR(20) NOT NULL,
  "result_grade" VARCHAR(10),
  "result_pct" DOUBLE PRECISION,
  "attendance_pct" DOUBLE PRECISION,
  "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  "remarks" VARCHAR(255),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_promotion_decisions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_promotion_decisions_school_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE,
  CONSTRAINT "student_promotion_decisions_batch_fkey" FOREIGN KEY ("batch_id") REFERENCES "student_promotion_batches"("id") ON DELETE SET NULL,
  CONSTRAINT "student_promotion_decisions_student_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE,
  CONSTRAINT "student_promotion_decisions_unique" UNIQUE ("school_id", "student_id", "academic_year")
);
CREATE INDEX IF NOT EXISTS "idx_promo_decisions_lookup" ON "student_promotion_decisions"("school_id", "academic_year", "from_grade", "status");

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'student_promotion_rules',
      'student_promotion_batches',
      'student_promotion_decisions'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I', tbl);
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
  END LOOP;
END $$;
