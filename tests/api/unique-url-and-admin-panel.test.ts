import { randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { GET as platformSchoolsGet } from "@/app/api/platform/schools/route";
import { authRepository } from "@/server/auth/auth-repository";
import { otpService, setOtpGeneratorForTesting } from "@/server/auth/otp-service";
import { getSessionCookieName, sessionService } from "@/server/auth/session-service";
import { hashPassword } from "@/server/security/crypto";
import { registerSchool } from "@/modules/schools/services/registration-service";

async function registerSyntheticSchool(tag: string) {
  const rand = `${Date.now()}_${randomBytes(3).toString("hex")}`;
  const email = `${tag.toLowerCase()}.${rand}@scholonix.example`;
  const phone = `+9196${Math.floor(10000000 + Math.random() * 89999999)}`;
  const password = `School!${randomBytes(6).toString("hex")}9A`;
  const code = "654321";

  setOtpGeneratorForTesting(() => code);
  try {
    await otpService.requestOtp({ identifier: phone, channel: "SMS", purpose: "REGISTRATION" });
    const phoneVerify = await otpService.verifyOtp({
      identifier: phone,
      channel: "SMS",
      purpose: "REGISTRATION",
      code,
    });

    await otpService.requestOtp({ identifier: email, channel: "EMAIL", purpose: "REGISTRATION" });
    const emailVerify = await otpService.verifyOtp({
      identifier: email,
      channel: "EMAIL",
      purpose: "REGISTRATION",
      code,
    });

    const result = await registerSchool({
      institution: {
        name: `Horizon Public Academy ${tag} ${rand}`,
        category: "Co-Educational School",
        affiliationBoard: "CBSE",
        contactPhone: phone,
        addressLine: "100 Education Lane",
        locality: "Shivajinagar",
        city: "Pune",
        state: "Maharashtra",
        pinCode: "411001",
        country: "India",
      },
      administrator: {
        adminName: `Admin ${tag}`,
        designation: "Principal",
        adminEmail: email,
        adminPhone: phone,
        password,
        confirmPassword: password,
      },
      mobileVerificationToken: phoneVerify.verificationToken,
      emailVerificationToken: emailVerify.verificationToken,
      plan: "professional",
      billingCycle: "yearly",
    });

    return { ...result, email, phone, password };
  } finally {
    setOtpGeneratorForTesting(undefined);
  }
}

describe("Opaque School URLs, Unique School IDs, Unique-URL Login & Company Admin Panel", () => {
  it("provisions opaque URLs (no school name) and unique School IDs, and restricts unique-URL login to authorized users", async () => {
    const schoolA = await registerSyntheticSchool("Alpha");
    const schoolB = await registerSyntheticSchool("Beta");

    // 1. Opaque URL does not leak school name and Unique ID matches SNX-YYYY-XXXXXX
    expect(schoolA.slug).toMatch(/^sc_[0-9a-f]{20,}$/);
    expect(schoolA.slug).not.toContain("horizon");
    expect(schoolA.slug).not.toContain("alpha");
    expect(schoolA.uniqueId).toMatch(/^SNX-\d{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6,}$/);
    expect(schoolB.uniqueId).not.toBe(schoolA.uniqueId);
    expect(schoolB.slug).not.toBe(schoolA.slug);

    // 2. Authorized user can sign in on their own school's unique login URL
    const ownLoginRes = await loginPost(
      new NextRequest("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          method: "password",
          identifier: schoolA.email,
          password: schoolA.password,
          schoolSlug: schoolA.slug,
        }),
      }),
    );
    expect(ownLoginRes.status).toBe(200);
    const ownJson = await ownLoginRes.json();
    expect(ownJson.success).toBe(true);
    expect(ownJson.data.school.uniqueId).toBe(schoolA.uniqueId);
    expect(ownJson.data.redirectTo).toBe(`/${schoolA.slug}`);
    expect(ownLoginRes.headers.get("set-cookie")).toContain(getSessionCookieName());

    // 3. Cross-tenant login on School B's unique URL with School A's valid credentials is blocked (403) with NO cookie
    const crossLoginRes = await loginPost(
      new NextRequest("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          method: "password",
          identifier: schoolA.email,
          password: schoolA.password,
          schoolSlug: schoolB.slug,
        }),
      }),
    );
    expect(crossLoginRes.status).toBe(403);
    const crossJson = await crossLoginRes.json();
    expect(crossJson.error.code).toBe("LOGIN_TENANT_MISMATCH");
    expect(crossLoginRes.headers.get("set-cookie")).toBeNull();
  });

  it("restricts Company Admin Panel search (/api/platform/schools) to PLATFORM_SUPER_ADMIN and searches by Unique School ID", async () => {
    const schoolA = await registerSyntheticSchool("Gamma");

    // Unauthenticated -> 401
    const unauthRes = await platformSchoolsGet(
      new NextRequest(`http://localhost/api/platform/schools?uniqueId=${schoolA.uniqueId}`),
    );
    expect(unauthRes.status).toBe(401);

    // School Admin -> 403
    const schoolAdminUser = await authRepository.findUserById(schoolA.adminId);
    expect(schoolAdminUser).not.toBeNull();
    const schoolAdminSession = await sessionService.createSession(schoolAdminUser!);
    const cookieName = getSessionCookieName();

    const forbiddenRes = await platformSchoolsGet(
      new NextRequest(`http://localhost/api/platform/schools?uniqueId=${schoolA.uniqueId}`, {
        headers: { cookie: `${cookieName}=${schoolAdminSession.token}` },
      }),
    );
    expect(forbiddenRes.status).toBe(403);

    // Platform Super Admin -> 200 and returns exact school details without passwordHash
    const superPassHash = await hashPassword(`Super!${randomBytes(6).toString("hex")}8Z`);
    const { user: superAdmin } = await authRepository.createUserWithSchool({
      school: {
        name: "ScholoNix Platform Org",
        slug: `sc_${randomBytes(10).toString("hex")}`,
        code: "PLT-001",
        category: "Platform",
      },
      user: {
        name: "Company Super Admin",
        email: `platform.${Date.now()}@scholonix.example`,
        phone: `+9195${Math.floor(10000000 + Math.random() * 89999999)}`,
        passwordHash: superPassHash,
        role: "PLATFORM_SUPER_ADMIN",
        phoneVerified: true,
        emailVerified: true,
      },
    });
    const superSession = await sessionService.createSession(superAdmin);

    const searchRes = await platformSchoolsGet(
      new NextRequest(
        `http://localhost/api/platform/schools?uniqueId=${encodeURIComponent(schoolA.uniqueId)}`,
        {
          headers: { cookie: `${cookieName}=${superSession.token}` },
        },
      ),
    );
    expect(searchRes.status).toBe(200);
    const searchJson = await searchRes.json();
    expect(searchJson.success).toBe(true);
    expect(searchJson.schools).toHaveLength(1);
    expect(searchJson.schools[0].school.id).toBe(schoolA.schoolId);
    expect(searchJson.schools[0].school.uniqueId).toBe(schoolA.uniqueId);
    expect(searchJson.schools[0].school.name).toBe(schoolA.schoolName);
    expect(searchJson.schools[0].users[0]).not.toHaveProperty("passwordHash");
  });
});
