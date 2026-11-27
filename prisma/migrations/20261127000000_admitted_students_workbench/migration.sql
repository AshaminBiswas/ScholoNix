-- =============================================================================
-- Admitted Students Workbench Migration (Additive + Tenant RLS Policies)
-- =============================================================================

ALTER TYPE "AdmissionType" ADD VALUE IF NOT EXISTS 'RE_ADMISSION';
ALTER TYPE "AdmissionType" ADD VALUE IF NOT EXISTS 'OTHER';

ALTER TABLE "admission_settings"
  ADD COLUMN IF NOT EXISTS "next_receipt_seq" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "admission_applications"
  ADD COLUMN IF NOT EXISTS "enrollment_status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE';

CREATE TABLE IF NOT EXISTS "admission_fee_ledgers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "application_id" UUID NOT NULL,
  "academic_year" VARCHAR(30) NOT NULL,
  "total_fee_paise" INTEGER NOT NULL DEFAULT 0,
  "concession_paise" INTEGER NOT NULL DEFAULT 0,
  "concession_reason" VARCHAR(255),
  "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
  "updated_by_user_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "admission_fee_ledgers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admission_fee_ledgers_school_id_fkey"
    FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "admission_fee_ledgers_application_id_fkey"
    FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "admission_fee_ledgers_application_id_key"
  ON "admission_fee_ledgers" ("application_id");

CREATE UNIQUE INDEX IF NOT EXISTS "admission_fee_ledgers_school_app_key"
  ON "admission_fee_ledgers" ("school_id", "application_id");

CREATE INDEX IF NOT EXISTS "admission_fee_ledgers_school_ay_idx"
  ON "admission_fee_ledgers" ("school_id", "academic_year");

CREATE TABLE IF NOT EXISTS "admission_fee_payments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "application_id" UUID NOT NULL,
  "receipt_number" VARCHAR(40) NOT NULL,
  "idempotency_key" VARCHAR(80) NOT NULL,
  "fee_head" VARCHAR(80) NOT NULL,
  "amount_paise" INTEGER NOT NULL,
  "payment_date" TIMESTAMPTZ(6) NOT NULL,
  "payment_mode" VARCHAR(40) NOT NULL,
  "reference_no" VARCHAR(120),
  "remarks" VARCHAR(255),
  "recorded_by_user_id" UUID,
  "recorded_by_name" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "admission_fee_payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admission_fee_payments_school_id_fkey"
    FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "admission_fee_payments_application_id_fkey"
    FOREIGN KEY ("application_id") REFERENCES "admission_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "admission_fee_payments_school_receipt_key"
  ON "admission_fee_payments" ("school_id", "receipt_number");

CREATE UNIQUE INDEX IF NOT EXISTS "admission_fee_payments_school_idemp_key"
  ON "admission_fee_payments" ("school_id", "idempotency_key");

CREATE INDEX IF NOT EXISTS "admission_fee_payments_school_app_date_idx"
  ON "admission_fee_payments" ("school_id", "application_id", "payment_date");

-- Row Level Security (RLS) Tenant Isolation Policies (idempotent without DROP)
ALTER TABLE "admission_fee_ledgers" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admission_fee_ledgers'
      AND policyname = 'tenant_isolation_admission_fee_ledgers'
  ) THEN
    CREATE POLICY "tenant_isolation_admission_fee_ledgers" ON "admission_fee_ledgers"
      AS PERMISSIVE FOR ALL
      USING (school_id = NULLIF(current_setting('app.current_school_id', true), '')::uuid)
      WITH CHECK (school_id = NULLIF(current_setting('app.current_school_id', true), '')::uuid);
  END IF;
END $$;

ALTER TABLE "admission_fee_payments" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admission_fee_payments'
      AND policyname = 'tenant_isolation_admission_fee_payments'
  ) THEN
    CREATE POLICY "tenant_isolation_admission_fee_payments" ON "admission_fee_payments"
      AS PERMISSIVE FOR ALL
      USING (school_id = NULLIF(current_setting('app.current_school_id', true), '')::uuid)
      WITH CHECK (school_id = NULLIF(current_setting('app.current_school_id', true), '')::uuid);
  END IF;
END $$;
