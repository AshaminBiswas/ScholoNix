import "server-only";
import { randomBytes } from "crypto";
import { hashPassword, normalizePhone } from "@/server/security/crypto";
import { authRepository } from "@/server/auth/auth-repository";
import { otpService } from "@/server/auth/otp-service";
import { logAuditEvent } from "@/server/security/audit-logger";
import { ConflictError, ValidationError, VerificationRequiredError } from "@/lib/errors";
import type { CompleteRegistrationInput } from "../schemas/registration";

export const RESERVED_SCHOOL_SLUGS = new Set([
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "dashboard",
  "help",
  "help-center",
  "faqs",
  "faq",
  "blog",
  "guides",
  "guide",
  "features",
  "pricing",
  "contact",
  "feedback",
  "for-schools",
  "api",
  "todos",
  "workspace",
  "admin",
  "platform",
  "unauthorized",
  "apple-icon.png",
  "icon.png",
  "favicon.ico",
  "manifest.webmanifest",
  "_next",
]);

export function isReservedSchoolSlug(slug: string): boolean {
  return RESERVED_SCHOOL_SLUGS.has(slug.trim().toLowerCase());
}

/**
 * Normalizes an institution name into a URL-friendly, safe slug.
 */
export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

  return base || "school";
}

/**
 * Resolves a unique, collision-free URL slug for a newly registered school.
 * Avoids reserved platform routes and deduplicates same-name schools cleanly.
 */
export async function generateUniqueSchoolSlug(name: string): Promise<string> {
  let base = generateSlug(name);
  if (isReservedSchoolSlug(base)) {
    base = `${base}-school`;
  }

  const maxAttempts = 25;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    if (isReservedSchoolSlug(candidate)) continue;
    const existing = await authRepository.findSchoolBySlug(candidate);
    if (!existing) {
      return candidate;
    }
  }

  return `${base}-${randomBytes(3).toString("hex")}`;
}

/**
 * Generates an institutional code based on school name initials and PIN code.
 */
export function generateSchoolCode(name: string, pinCode: string): string {
  const initials = name
    .split(/\s+/)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .filter(Boolean)
    .slice(0, 4)
    .join("");

  const pinSuffix = pinCode.slice(-3);
  return `${initials || "SCH"}-${pinSuffix}`;
}

export interface RegistrationResult {
  schoolId: string;
  schoolName: string;
  slug: string;
  adminId: string;
  adminName: string;
  adminPhone: string;
  adminEmail: string;
  plan: string;
}

/**
 * Registers a new school tenant and provisions its primary administrator transactionally.
 * Requires both Email and Mobile verification to succeed.
 */
export async function registerSchool(
  input: CompleteRegistrationInput,
  meta?: { ipAddress?: string; userAgent?: string },
): Promise<RegistrationResult> {
  const { institution, administrator, plan = "professional" } = input;
  const normalizedPhone = normalizePhone(administrator.adminPhone);
  const normalizedEmail = administrator.adminEmail.trim().toLowerCase();

  // 1. Check if an account already exists with this email or mobile
  const existingUserByEmail = await authRepository.findUserByIdentifier(normalizedEmail);
  if (existingUserByEmail) {
    throw new ConflictError("An account with this email address is already registered.");
  }

  const existingUserByPhone = await authRepository.findUserByIdentifier(normalizedPhone);
  if (existingUserByPhone) {
    throw new ConflictError("An account with this mobile number is already registered.");
  }

  // 2. Validate Dual Verification (Mobile + Email)
  let mobileVerified = false;
  let emailVerified = false;
  let activeMobileToken = input.mobileVerificationToken || undefined;
  let activeEmailToken = input.emailVerificationToken || undefined;
  const registrationSessionId = input.registrationSessionId || undefined;

  // Check mobile verification token or code
  if (activeMobileToken) {
    const val = await otpService.validateVerificationToken(
      activeMobileToken,
      "SMS",
      "REGISTRATION",
      registrationSessionId,
    );
    if (val.valid) {
      if (val.identifier && normalizePhone(val.identifier) !== normalizedPhone) {
        throw new ValidationError(
          "Verified mobile number does not match administrator phone number.",
        );
      }
      mobileVerified = true;
    }
  } else if (input.mobileOtpCode) {
    const verifyRes = await otpService.verifyOtp({
      identifier: normalizedPhone,
      channel: "SMS",
      purpose: "REGISTRATION",
      code: input.mobileOtpCode,
      registrationSessionId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
    if (verifyRes.verified) {
      mobileVerified = true;
      activeMobileToken = verifyRes.verificationToken;
    }
  } else {
    // Check if backend has a valid, active verification record for this mobile
    const status = await otpService.getVerificationStatus({
      identifier: normalizedPhone,
      channel: "SMS",
      purpose: "REGISTRATION",
      registrationSessionId,
    });
    if (status.isVerified && status.verificationToken) {
      mobileVerified = true;
      activeMobileToken = status.verificationToken;
    }
  }

  // Check email verification token or code
  if (activeEmailToken) {
    const val = await otpService.validateVerificationToken(
      activeEmailToken,
      "EMAIL",
      "REGISTRATION",
      registrationSessionId,
    );
    if (val.valid) {
      if (val.identifier && val.identifier.toLowerCase() !== normalizedEmail) {
        throw new ValidationError(
          "Verified email address does not match administrator email address. Please verify your new email address.",
        );
      }
      emailVerified = true;
    }
  } else if (input.emailOtpCode) {
    const verifyRes = await otpService.verifyOtp({
      identifier: normalizedEmail,
      channel: "EMAIL",
      purpose: "REGISTRATION",
      code: input.emailOtpCode,
      registrationSessionId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
    if (verifyRes.verified) {
      emailVerified = true;
      activeEmailToken = verifyRes.verificationToken;
    }
  } else {
    // Check if backend has a valid, active verification record for this email
    const status = await otpService.getVerificationStatus({
      identifier: normalizedEmail,
      channel: "EMAIL",
      purpose: "REGISTRATION",
      registrationSessionId,
    });
    if (status.isVerified && status.verificationToken) {
      emailVerified = true;
      activeEmailToken = status.verificationToken;
    }
  }

  // In production, both MUST be verified
  if (!mobileVerified || !emailVerified) {
    // If not verified, throw descriptive verification required error (HTTP 403)
    const unverifiedList: string[] = [];
    if (!mobileVerified) unverifiedList.push("Mobile number");
    if (!emailVerified) unverifiedList.push("Email address");

    throw new VerificationRequiredError(
      `Please complete verification for: ${unverifiedList.join(" and ")}. Both are required to activate your account.`,
    );
  }

  // 3. Generate unique non-reserved slug and school code
  const slug = await generateUniqueSchoolSlug(institution.name);
  const code = generateSchoolCode(institution.name, institution.pinCode);

  // 4. Hash administrator password
  const passwordHash = await hashPassword(administrator.password);

  // 5. Create School tenant & Admin User transactionally
  const { school, user } = await authRepository.createUserWithSchool({
    school: {
      name: institution.name.trim(),
      slug,
      code,
      category: institution.category,
      affiliationBoard: institution.affiliationBoard || "CBSE",
      contactPhone: institution.contactPhone.trim(),
      contactEmail: normalizedEmail,
      website: institution.website || undefined,
      addressLine: institution.addressLine.trim(),
      city: institution.city.trim(),
      state: institution.state.trim(),
      pinCode: institution.pinCode.trim(),
      country: institution.country.trim() || "India",
      plan,
    },
    user: {
      name: administrator.adminName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash,
      role: "SCHOOL_ADMIN",
      phoneVerified: true,
      emailVerified: true,
    },
  });

  // 6. Invalidate/consume verification tokens to prevent reuse
  if (activeMobileToken) {
    await otpService.consumeVerificationToken(activeMobileToken);
  }
  if (activeEmailToken) {
    await otpService.consumeVerificationToken(activeEmailToken);
  }

  // 7. Record immutable audit log
  await logAuditEvent({
    schoolId: school.id,
    actorId: user.id,
    action: "SCHOOL_REGISTERED",
    entityType: "School",
    entityId: school.id,
    details: {
      schoolName: school.name,
      slug: school.slug,
      adminName: user.name,
      adminPhone: user.phone,
      adminEmail: user.email,
      plan,
    },
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });

  return {
    schoolId: school.id,
    schoolName: school.name,
    slug: school.slug,
    adminId: user.id,
    adminName: user.name,
    adminPhone: user.phone || normalizedPhone,
    adminEmail: user.email || normalizedEmail,
    plan,
  };
}
