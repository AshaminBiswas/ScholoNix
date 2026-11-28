-- Parents & Guardians Management Suite Migration (Idempotent & Supabase-safe)

CREATE TABLE IF NOT EXISTS "guardians" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "user_id" UUID,
  "full_name" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(30) NOT NULL,
  "normalized_phone" VARCHAR(30),
  "alternate_phone" VARCHAR(30),
  "email" VARCHAR(255),
  "occupation" VARCHAR(150),
  "employer" VARCHAR(180),
  "education" VARCHAR(150),
  "preferred_language" VARCHAR(60) DEFAULT 'English',
  "address_json" JSONB,
  "id_proof_type" VARCHAR(60),
  "id_proof_masked" VARCHAR(60),
  "photo_key" VARCHAR(500),
  "phone_verified" BOOLEAN NOT NULL DEFAULT false,
  "email_verified" BOOLEAN NOT NULL DEFAULT false,
  "portal_status" VARCHAR(30) NOT NULL DEFAULT 'NOT_INVITED',
  "portal_invited_at" TIMESTAMPTZ(6),
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "communication_prefs" JSONB,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "guardians_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "guardians_school_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE,
  CONSTRAINT "guardians_school_phone_unique" UNIQUE ("school_id", "normalized_phone")
);

CREATE INDEX IF NOT EXISTS "idx_guardians_school_status" ON "guardians"("school_id", "status", "portal_status");
CREATE INDEX IF NOT EXISTS "idx_guardians_school_email" ON "guardians"("school_id", "email");
CREATE INDEX IF NOT EXISTS "idx_guardians_school_user" ON "guardians"("school_id", "user_id");

CREATE TABLE IF NOT EXISTS "student_guardian_links" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "guardian_id" UUID NOT NULL,
  "relation" VARCHAR(60) NOT NULL DEFAULT 'Parent',
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "is_emergency_contact" BOOLEAN NOT NULL DEFAULT true,
  "can_pickup" BOOLEAN NOT NULL DEFAULT true,
  "is_fee_payer" BOOLEAN NOT NULL DEFAULT false,
  "receives_academic_alerts" BOOLEAN NOT NULL DEFAULT true,
  "receives_fee_alerts" BOOLEAN NOT NULL DEFAULT true,
  "custody_note" VARCHAR(500),
  "restricted_contact" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "linked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "unlinked_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_guardian_links_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_guardian_links_school_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE,
  CONSTRAINT "student_guardian_links_student_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE,
  CONSTRAINT "student_guardian_links_guardian_fkey" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE CASCADE,
  CONSTRAINT "student_guardian_links_unique" UNIQUE ("school_id", "student_id", "guardian_id")
);

CREATE INDEX IF NOT EXISTS "idx_sgl_guardian_active" ON "student_guardian_links"("school_id", "guardian_id", "is_active");
CREATE INDEX IF NOT EXISTS "idx_sgl_student_primary" ON "student_guardian_links"("school_id", "student_id", "is_primary");

CREATE TABLE IF NOT EXISTS "guardian_communications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "guardian_id" UUID NOT NULL,
  "student_id" UUID,
  "channel" VARCHAR(20) NOT NULL,
  "direction" VARCHAR(20) NOT NULL DEFAULT 'OUTBOUND',
  "sender_name" VARCHAR(150) NOT NULL,
  "recipient_name" VARCHAR(150) NOT NULL,
  "subject" VARCHAR(255),
  "body" TEXT NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'SENT',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "guardian_communications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "guardian_communications_school_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE,
  CONSTRAINT "guardian_communications_guardian_fkey" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE CASCADE,
  CONSTRAINT "guardian_communications_student_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "idx_guardian_comms_lookup" ON "guardian_communications"("school_id", "guardian_id", "created_at");

-- Tenant Isolation Row Level Security (Idempotent, DROP-free)
DO $$
DECLARE
  tbl TEXT;
  policy_exists BOOLEAN;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'guardians',
      'student_guardian_links',
      'guardian_communications'
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

-- Idempotent Backfill from existing students.guardian_* records
INSERT INTO "guardians" (
  "school_id",
  "full_name",
  "phone",
  "normalized_phone",
  "email",
  "address_json",
  "communication_prefs",
  "status"
)
SELECT DISTINCT ON (s."school_id", NULLIF(regexp_replace(COALESCE(s."guardian_phone", ''), '[^0-9+]', '', 'g'), ''))
  s."school_id",
  COALESCE(NULLIF(trim(s."guardian_name"), ''), 'Parent / Guardian'),
  COALESCE(NULLIF(trim(s."guardian_phone"), ''), '0000000000'),
  NULLIF(regexp_replace(COALESCE(s."guardian_phone", ''), '[^0-9+]', '', 'g'), ''),
  NULLIF(trim(COALESCE(s."guardian_email", '')), ''),
  s."address_json",
  '{"sms":true,"email":true,"whatsapp":true,"inApp":true,"feeReminders":true,"attendanceAlerts":true,"academicUpdates":true,"mediaConsent":true}'::jsonb,
  'ACTIVE'
FROM "students" s
WHERE NULLIF(trim(s."guardian_name"), '') IS NOT NULL
  AND NULLIF(regexp_replace(COALESCE(s."guardian_phone", ''), '[^0-9+]', '', 'g'), '') IS NOT NULL
ORDER BY s."school_id", NULLIF(regexp_replace(COALESCE(s."guardian_phone", ''), '[^0-9+]', '', 'g'), ''), s."created_at" ASC
ON CONFLICT ("school_id", "normalized_phone") DO NOTHING;

INSERT INTO "student_guardian_links" (
  "school_id",
  "student_id",
  "guardian_id",
  "relation",
  "is_primary",
  "is_emergency_contact",
  "can_pickup",
  "is_fee_payer"
)
SELECT
  s."school_id",
  s."id",
  g."id",
  COALESCE(NULLIF(trim(s."guardian_relation"), ''), 'Parent'),
  true,
  true,
  true,
  true
FROM "students" s
JOIN "guardians" g
  ON g."school_id" = s."school_id"
 AND g."normalized_phone" = NULLIF(regexp_replace(COALESCE(s."guardian_phone", ''), '[^0-9+]', '', 'g'), '')
ON CONFLICT ("school_id", "student_id", "guardian_id") DO NOTHING;
