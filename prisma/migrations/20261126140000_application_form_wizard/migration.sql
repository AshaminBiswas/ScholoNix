-- Additive migration for 4-step Student Application Form Wizard (Fresh & Transfer admissions, drafts, and documents)

DO $$ BEGIN
  CREATE TYPE "AdmissionType" AS ENUM ('FRESH', 'TRANSFER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "admission_applications"
  ADD COLUMN IF NOT EXISTS "admission_type" "AdmissionType" NOT NULL DEFAULT 'FRESH',
  ADD COLUMN IF NOT EXISTS "is_draft" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "current_step" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "student_photo_key" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "nationality" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "blood_group" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "student_id_number" VARCHAR(60),
  ADD COLUMN IF NOT EXISTS "student_details" JSONB,
  ADD COLUMN IF NOT EXISTS "guardian_details" JSONB,
  ADD COLUMN IF NOT EXISTS "academic_details" JSONB,
  ADD COLUMN IF NOT EXISTS "uploaded_documents" JSONB,
  ADD COLUMN IF NOT EXISTS "declaration_accepted" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "admission_applications_school_id_is_draft_updated_at_idx"
  ON "admission_applications"("school_id", "is_draft", "updated_at");
