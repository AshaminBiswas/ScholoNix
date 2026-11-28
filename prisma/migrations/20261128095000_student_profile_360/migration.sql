-- Student Profile 360 Additive Schema & RLS Migration
ALTER TABLE "students"
  ADD COLUMN IF NOT EXISTS "profile_extended" JSONB;

CREATE TABLE IF NOT EXISTS "student_attendance_records" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "academic_year" VARCHAR(30) NOT NULL,
  "attendance_date" DATE NOT NULL,
  "status" VARCHAR(20) NOT NULL,
  "remarks" VARCHAR(255),
  "marked_by_name" VARCHAR(150) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_attendance_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_attendance_records_school_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE,
  CONSTRAINT "student_attendance_records_student_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE,
  CONSTRAINT "student_attendance_unique" UNIQUE ("school_id", "student_id", "attendance_date")
);
CREATE INDEX IF NOT EXISTS "idx_stu_attendance_lookup" ON "student_attendance_records"("school_id", "student_id", "academic_year", "attendance_date");

CREATE TABLE IF NOT EXISTS "student_exam_results" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "academic_year" VARCHAR(30) NOT NULL,
  "term" VARCHAR(40) NOT NULL,
  "subject" VARCHAR(100) NOT NULL,
  "max_marks" INTEGER NOT NULL,
  "marks_obtained" DOUBLE PRECISION NOT NULL,
  "grade" VARCHAR(10) NOT NULL,
  "class_rank" INTEGER,
  "school_rank" INTEGER,
  "remarks" VARCHAR(255),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_exam_results_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_exam_results_school_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE,
  CONSTRAINT "student_exam_results_student_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE,
  CONSTRAINT "student_exam_result_unique" UNIQUE ("school_id", "student_id", "academic_year", "term", "subject")
);
CREATE INDEX IF NOT EXISTS "idx_stu_exam_lookup" ON "student_exam_results"("school_id", "student_id", "academic_year", "term");

CREATE TABLE IF NOT EXISTS "student_documents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "document_name" VARCHAR(150) NOT NULL,
  "document_type" VARCHAR(60) NOT NULL,
  "is_required" BOOLEAN NOT NULL DEFAULT false,
  "file_name" VARCHAR(255) NOT NULL,
  "file_key" VARCHAR(500) NOT NULL,
  "file_size_bytes" INTEGER NOT NULL DEFAULT 0,
  "mime_type" VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
  "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "uploaded_by_name" VARCHAR(150) NOT NULL,
  "verified_by_name" VARCHAR(150),
  "verified_at" TIMESTAMPTZ(6),
  "remarks" VARCHAR(255),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_documents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_documents_school_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE,
  CONSTRAINT "student_documents_student_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_stu_docs_lookup" ON "student_documents"("school_id", "student_id", "status");

CREATE TABLE IF NOT EXISTS "student_communications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "channel" VARCHAR(20) NOT NULL,
  "direction" VARCHAR(20) NOT NULL DEFAULT 'OUTBOUND',
  "sender_name" VARCHAR(150) NOT NULL,
  "recipient_name" VARCHAR(150) NOT NULL,
  "subject" VARCHAR(255),
  "body" TEXT NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'SENT',
  "attachment_key" VARCHAR(500),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_communications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_communications_school_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE,
  CONSTRAINT "student_communications_student_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_stu_comms_lookup" ON "student_communications"("school_id", "student_id", "created_at");

CREATE TABLE IF NOT EXISTS "student_homework_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "subject" VARCHAR(100) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "assigned_on" DATE NOT NULL,
  "due_date" DATE NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "remarks" VARCHAR(255),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_homework_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_homework_items_school_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE,
  CONSTRAINT "student_homework_items_student_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_stu_hw_lookup" ON "student_homework_items"("school_id", "student_id", "due_date");

CREATE TABLE IF NOT EXISTS "student_co_curricular_activities" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "category" VARCHAR(60) NOT NULL,
  "event_date" DATE NOT NULL,
  "status" VARCHAR(60) NOT NULL,
  "achievement" VARCHAR(150),
  "remarks" VARCHAR(255),
  "certificate_key" VARCHAR(500),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_co_curricular_activities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_co_curricular_activities_school_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE,
  CONSTRAINT "student_co_curricular_activities_student_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_stu_cocurricular_lookup" ON "student_co_curricular_activities"("school_id", "student_id", "event_date");

CREATE TABLE IF NOT EXISTS "student_notes_remarks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "tab_scope" VARCHAR(30) NOT NULL,
  "kind" VARCHAR(30) NOT NULL DEFAULT 'REMARK',
  "title" VARCHAR(200),
  "body" TEXT NOT NULL,
  "is_completed" BOOLEAN NOT NULL DEFAULT false,
  "due_date" DATE,
  "author_name" VARCHAR(150) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_notes_remarks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_notes_remarks_school_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE,
  CONSTRAINT "student_notes_remarks_student_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_stu_notes_lookup" ON "student_notes_remarks"("school_id", "student_id", "tab_scope", "created_at");

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'student_attendance_records',
      'student_exam_results',
      'student_documents',
      'student_communications',
      'student_homework_items',
      'student_co_curricular_activities',
      'student_notes_remarks'
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
