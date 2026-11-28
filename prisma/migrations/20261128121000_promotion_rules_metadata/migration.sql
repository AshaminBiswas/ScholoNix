-- Additive metadata columns for redesigned Promotion Rules tab (rule_name, criteria_summary, conditions, grade_criteria)
ALTER TABLE "student_promotion_rules"
  ADD COLUMN IF NOT EXISTS "rule_name" VARCHAR(150),
  ADD COLUMN IF NOT EXISTS "criteria_summary" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "require_assessments_completed" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "require_result_published" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "require_fee_clearance" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "grade_criteria" JSONB;
