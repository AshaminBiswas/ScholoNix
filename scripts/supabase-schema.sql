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
