-- =============================================================================
-- ScholoNix — Supabase / PostgreSQL Production Schema DDL
-- Execute in Supabase SQL Editor to provision all authentication & school tables
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE "SchoolStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'INACTIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM (
        'PLATFORM_SUPER_ADMIN',
        'SCHOOL_ADMIN',
        'PRINCIPAL',
        'TEACHER',
        'ACCOUNTANT',
        'STAFF',
        'PARENT',
        'STUDENT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'INVITED', 'PENDING_VERIFICATION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "OtpChannel" AS ENUM ('EMAIL', 'SMS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "OtpPurpose" AS ENUM ('REGISTRATION', 'LOGIN', 'PASSWORD_RESET');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. SCHOOLS TABLE
CREATE TABLE IF NOT EXISTS "schools" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL UNIQUE,
    "code" VARCHAR(50) UNIQUE,
    "category" VARCHAR(100) NOT NULL DEFAULT 'Co-Educational School',
    "affiliation_board" VARCHAR(100),
    "contact_phone" VARCHAR(20) NOT NULL,
    "contact_email" VARCHAR(255),
    "website" VARCHAR(255),
    "address_line" VARCHAR(255) NOT NULL,
    "locality" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pin_code" VARCHAR(20) NOT NULL,
    "country" VARCHAR(100) NOT NULL DEFAULT 'India',
    "logo_url" TEXT,
    "status" "SchoolStatus" NOT NULL DEFAULT 'TRIAL',
    "onboarding_step" INTEGER NOT NULL DEFAULT 1,
    "onboarding_done" BOOLEAN NOT NULL DEFAULT false,
    "trial_ends_at" TIMESTAMPTZ(6),
    "parent_school_id" UUID REFERENCES "schools"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_schools_status" ON "schools"("status");
CREATE INDEX IF NOT EXISTS "idx_schools_slug" ON "schools"("slug");

-- 3. USERS TABLE
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "school_id" UUID REFERENCES "schools"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'SCHOOL_ADMIN',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified_at" TIMESTAMPTZ(6),
    "email_verified_at" TIMESTAMPTZ(6),
    "phone_verification_provider" VARCHAR(50) DEFAULT 'SMS_OTP',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    CONSTRAINT "uq_users_phone_school" UNIQUE ("phone", "school_id")
);

CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_phone" ON "users"("phone");
CREATE INDEX IF NOT EXISTS "idx_users_school_id" ON "users"("school_id");
CREATE INDEX IF NOT EXISTS "idx_users_status" ON "users"("status");

-- 4. OTP VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS "otp_verifications" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "identifier" VARCHAR(255) NOT NULL,
    "channel" "OtpChannel" NOT NULL,
    "purpose" "OtpPurpose" NOT NULL DEFAULT 'REGISTRATION',
    "code_hash" VARCHAR(255) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "resend_after" TIMESTAMPTZ(6) NOT NULL,
    "verified_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "user_id" UUID REFERENCES "users"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_otp_identifier_purpose" ON "otp_verifications"("identifier", "purpose", "channel");
CREATE INDEX IF NOT EXISTS "idx_otp_expires_at" ON "otp_verifications"("expires_at");

-- 5. USER SESSIONS TABLE
CREATE TABLE IF NOT EXISTS "user_sessions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token_hash" VARCHAR(255) NOT NULL UNIQUE,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_user_sessions_user" ON "user_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_token" ON "user_sessions"("token_hash");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_expires" ON "user_sessions"("expires_at");

-- 6. PASSWORD RESET REQUESTS TABLE
CREATE TABLE IF NOT EXISTS "password_reset_requests" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "reset_token_hash" VARCHAR(255) NOT NULL UNIQUE,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_password_resets_user" ON "password_reset_requests"("user_id");
CREATE INDEX IF NOT EXISTS "idx_password_resets_token" ON "password_reset_requests"("reset_token_hash");

-- 7. RATE LIMIT RECORDS TABLE
CREATE TABLE IF NOT EXISTS "rate_limit_records" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "key" VARCHAR(255) NOT NULL UNIQUE,
    "points" INTEGER NOT NULL DEFAULT 0,
    "reset_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_rate_limit_key_reset" ON "rate_limit_records"("key", "reset_at");

-- 8. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "school_id" UUID REFERENCES "schools"("id") ON DELETE CASCADE,
    "actor_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" VARCHAR(255) NOT NULL,
    "metadata" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_audit_logs_school" ON "audit_logs"("school_id", "created_at");

-- 9. MIGRATION FOR FIREBASE PNV (Idempotent)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_verification_provider" VARCHAR(50) DEFAULT 'SMS_OTP';

CREATE INDEX IF NOT EXISTS "idx_audit_logs_actor" ON "audit_logs"("actor_id");

-- =============================================================================
-- 10. ADMISSIONS MANAGEMENT TABLES & RLS POLICIES (Idempotent)
-- =============================================================================

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
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
    "current_academic_year" VARCHAR(30) NOT NULL,
    "application_deadline" TIMESTAMPTZ(6),
    "application_prefix" VARCHAR(16) NOT NULL DEFAULT 'APP',
    "next_application_seq" INTEGER NOT NULL DEFAULT 1,
    "next_enquiry_seq" INTEGER NOT NULL DEFAULT 1,
    "next_admission_seq" INTEGER NOT NULL DEFAULT 1,
    "enabled_grades" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    CONSTRAINT "admission_settings_school_id_key" UNIQUE ("school_id")
);

CREATE TABLE IF NOT EXISTS "admission_enquiries" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
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
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    CONSTRAINT "admission_enquiries_school_id_enquiry_code_key" UNIQUE ("school_id", "enquiry_code")
);

CREATE INDEX IF NOT EXISTS "admission_enquiries_school_id_academic_year_status_created_at_idx"
    ON "admission_enquiries"("school_id", "academic_year", "status", "created_at");

CREATE TABLE IF NOT EXISTS "admission_applications" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
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
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "shortlisted_at" TIMESTAMPTZ(6),
    "admitted_at" TIMESTAMPTZ(6),
    "rejected_at" TIMESTAMPTZ(6),
    "verified_at" TIMESTAMPTZ(6),
    "reviewed_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    CONSTRAINT "admission_applications_school_id_application_code_key" UNIQUE ("school_id", "application_code"),
    CONSTRAINT "admission_applications_school_id_admission_number_key" UNIQUE ("school_id", "admission_number")
);

CREATE INDEX IF NOT EXISTS "admission_applications_school_id_academic_year_status_applied_at_idx"
    ON "admission_applications"("school_id", "academic_year", "status", "applied_at");
CREATE INDEX IF NOT EXISTS "admission_applications_school_id_academic_year_grade_applied_idx"
    ON "admission_applications"("school_id", "academic_year", "grade_applied");
CREATE INDEX IF NOT EXISTS "admission_applications_school_id_applied_at_idx"
    ON "admission_applications"("school_id", "applied_at");

CREATE TABLE IF NOT EXISTS "admission_reminders" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "academic_year" VARCHAR(30),
    "due_date" TIMESTAMPTZ(6),
    "priority" "AdmissionReminderPriority" NOT NULL DEFAULT 'INFO',
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "admission_reminders_school_id_academic_year_is_completed_created_at_idx"
    ON "admission_reminders"("school_id", "academic_year", "is_completed", "created_at");

CREATE TABLE IF NOT EXISTS "admission_activities" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
    "application_id" UUID,
    "enquiry_id" UUID,
    "actor_id" UUID,
    "actor_name" VARCHAR(255) NOT NULL,
    "action" VARCHAR(80) NOT NULL,
    "summary" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "admission_activities_school_id_created_at_idx"
    ON "admission_activities"("school_id", "created_at");

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
