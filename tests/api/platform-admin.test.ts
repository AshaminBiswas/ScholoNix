import { createHash, generateKeyPairSync, randomBytes, sign as cryptoSign } from "crypto";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET as overviewGet } from "@/app/api/platform/overview/route";
import { GET as schoolsGet, POST as schoolsPost } from "@/app/api/platform/schools/route";
import { PATCH as schoolPatch, DELETE as schoolDelete } from "@/app/api/platform/schools/[schoolId]/route";
import { GET as schoolUsersGet, POST as schoolUsersPost } from "@/app/api/platform/schools/[schoolId]/users/route";
import { PATCH as schoolUserPatch } from "@/app/api/platform/schools/[schoolId]/users/[userId]/route";
import { GET as schoolDataGet, PATCH as schoolDataPatch } from "@/app/api/platform/schools/[schoolId]/data/route";
import { GET as globalUsersGet, PATCH as globalUsersPatch } from "@/app/api/platform/users/route";
import { GET as billingGet, POST as billingPost, PATCH as billingPatch } from "@/app/api/platform/billing/route";
import { GET as supportGet, PATCH as supportPatch } from "@/app/api/platform/support/route";
import { GET as auditGet } from "@/app/api/platform/audit-logs/route";
import { GET as annGet, POST as annPost, PATCH as annPatch, DELETE as annDelete } from "@/app/api/platform/announcements/route";
import { POST as platformLoginPost } from "@/app/api/platform/auth/login/route";
import { POST as platformLogoutPost } from "@/app/api/platform/auth/logout/route";
import { POST as platformChangePwdPost } from "@/app/api/platform/auth/change-password/route";
import { POST as platformContactSendPost } from "@/app/api/platform/auth/verify-contact/send/route";
import { POST as platformContactVerifyPost } from "@/app/api/platform/auth/verify-contact/verify/route";
import { GET as platformTotpGet, POST as platformTotpPost } from "@/app/api/platform/auth/mfa/totp/route";
import { POST as platformMfaVerifyPost } from "@/app/api/platform/auth/mfa/verify/route";
import { POST as platformPasskeyChallengePost } from "@/app/api/platform/auth/passkey/challenge/route";
import { POST as platformPasskeyRegisterPost } from "@/app/api/platform/auth/passkey/register/route";
import { POST as platformPasskeyVerifyPost } from "@/app/api/platform/auth/passkey/verify/route";
import { GET as adminsGet, POST as adminsPost, PATCH as adminsPatch, DELETE as adminsDelete } from "@/app/api/platform/admins/route";
import { platformAdminAuthService, getPlatformAdminCookieName } from "@/server/platform/platform-admin-auth";
import { generateTotpCode } from "@/server/platform/platform-mfa-crypto";
import { setOtpGeneratorForTesting } from "@/server/auth/otp-service";
import { POST as contactPost } from "@/app/api/contact/route";
import { POST as feedbackPost } from "@/app/api/feedback/route";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { POST as createAppPost } from "@/app/api/school/admissions/applications/route";
import { authRepository } from "@/server/auth/auth-repository";
import { getSessionCookieName, sessionService } from "@/server/auth/session-service";
import { hashPassword } from "@/server/security/crypto";

async function seedActor(role: "PLATFORM_SUPER_ADMIN" | "SCHOOL_ADMIN") {
  const unique = `${role.toLowerCase()}-${Date.now()}-${randomBytes(3).toString("hex")}`;
  // gitleaks:allow — ephemeral randomized test credential, never static
  const rawPassword = ["Tx", randomBytes(8).toString("hex"), "9!"].join("");
  const passwordHash = await hashPassword(rawPassword);
  const { school, user } = await authRepository.createUserWithSchool({
    school: {
      name: `Platform Seed ${unique}`,
      slug: `sc_${randomBytes(10).toString("hex")}`,
      code: `PL-${randomBytes(2).toString("hex").toUpperCase()}`,
      category: "Co-Educational School",
      affiliationBoard: "CBSE",
      city: "Jaipur",
      state: "Rajasthan",
      pinCode: "302001",
      country: "India",
    },
    user: {
      name: `User ${unique}`,
      email: `${unique}@scholonix.example`,
      phone: `+9194${Math.floor(10000000 + Math.random() * 89999999)}`,
      passwordHash,
      role,
      phoneVerified: true,
      emailVerified: true,
    },
  });
  const session = await sessionService.createSession(user);
  const cookieHeader = `${getSessionCookieName()}=${session.token}`;
  return { school, user, cookieHeader, rawPassword };
}

describe("Company Super-Admin Platform API & Governance", () => {
  it("enforces strict PLATFORM_SUPER_ADMIN authorization across all platform endpoints", async () => {
    const tenantAdmin = await seedActor("SCHOOL_ADMIN");

    const unauthOverview = await overviewGet(new NextRequest("http://localhost/api/platform/overview"));
    expect(unauthOverview.status).toBe(401);

    const endpoints = [
      overviewGet(new NextRequest("http://localhost/api/platform/overview", { headers: { cookie: tenantAdmin.cookieHeader } })),
      schoolsGet(new NextRequest("http://localhost/api/platform/schools", { headers: { cookie: tenantAdmin.cookieHeader } })),
      globalUsersGet(new NextRequest("http://localhost/api/platform/users", { headers: { cookie: tenantAdmin.cookieHeader } })),
      billingGet(new NextRequest("http://localhost/api/platform/billing", { headers: { cookie: tenantAdmin.cookieHeader } })),
      supportGet(new NextRequest("http://localhost/api/platform/support", { headers: { cookie: tenantAdmin.cookieHeader } })),
      auditGet(new NextRequest("http://localhost/api/platform/audit-logs", { headers: { cookie: tenantAdmin.cookieHeader } })),
      annGet(new NextRequest("http://localhost/api/platform/announcements", { headers: { cookie: tenantAdmin.cookieHeader } })),
    ];

    const responses = await Promise.all(endpoints);
    for (const res of responses) {
      expect(res.status).toBe(403);
    }
  });

  it("provisions schools, manages plan/modules/users/suspension, inspects tenant data, issues SaaS invoices, triages support, and logs audits", async () => {
    const superAdmin = await seedActor("PLATFORM_SUPER_ADMIN");
    const uniqueSuffix = randomBytes(3).toString("hex");
    const principalEmail = `principal.${uniqueSuffix}@scholonix.example`;
    const principalPass = ["Px", randomBytes(6).toString("hex"), "9!"].join(""); // gitleaks:allow

    // 1. Provision a new school + Principal
    const provRes = await schoolsPost(
      new NextRequest("http://localhost/api/platform/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: superAdmin.cookieHeader },
        body: JSON.stringify({
          name: `Apex Synthetic Academy ${uniqueSuffix}`,
          affiliationBoard: "ICSE",
          contactPhone: "+919876500112",
          contactEmail: `office.${uniqueSuffix}@scholonix.example`,
          city: "Pune",
          state: "Maharashtra",
          plan: "PROFESSIONAL",
          status: "ACTIVE",
          adminName: "Principal Apex",
          adminEmail: principalEmail,
          adminPhone: `+9198${Math.floor(10000000 + Math.random() * 89999999)}`,
          adminPassword: principalPass,
          adminRole: "PRINCIPAL",
        }),
      }),
    );
    expect(provRes.status).toBe(201);
    const provJson = await provRes.json();
    const schoolId = provJson.entry.school.id as string;
    const schoolSlug = provJson.entry.school.slug as string;
    expect(provJson.entry.school.uniqueId).toMatch(/^SNX-/);
    expect(provJson.entry.school.plan).toBe("PROFESSIONAL");

    // 2. Update SaaS plan, quotas & module flags
    const patchPlanRes = await schoolPatch(
      new NextRequest(`http://localhost/api/platform/schools/${schoolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", cookie: superAdmin.cookieHeader },
        body: JSON.stringify({
          plan: "ENTERPRISE",
          maxStudentsLimit: 5000,
          enabledModules: {
            admissions: true,
            enquiries: true,
            admittedStudents: true,
            feeLedgers: true,
            customFields: true,
            crmIntegration: false,
            reportsExport: true,
            smsAlerts: false,
          },
        }),
      }),
      { params: Promise.resolve({ schoolId }) },
    );
    expect(patchPlanRes.status).toBe(200);
    const patchPlanJson = await patchPlanRes.json();
    expect(patchPlanJson.school.plan).toBe("ENTERPRISE");
    expect(patchPlanJson.school.maxStudentsLimit).toBe(5000);
    expect(patchPlanJson.school.enabledModules.crmIntegration).toBe(false);

    // 3. Suspend school -> blocks tenant Principal login (403 SCHOOL_SUSPENDED)
    const suspendRes = await schoolPatch(
      new NextRequest(`http://localhost/api/platform/schools/${schoolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", cookie: superAdmin.cookieHeader },
        body: JSON.stringify({
          status: "SUSPENDED",
          suspendedReason: "Payment overdue",
        }),
      }),
      { params: Promise.resolve({ schoolId }) },
    );
    expect(suspendRes.status).toBe(200);

    const blockedLoginRes = await loginPost(
      new NextRequest("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "password",
          identifier: principalEmail,
          password: principalPass,
          schoolSlug,
        }),
      }),
    );
    expect(blockedLoginRes.status).toBe(403);
    const blockedJson = await blockedLoginRes.json();
    expect(blockedJson.error.code).toBe("SCHOOL_SUSPENDED");

    // Reactivate school -> login succeeds (200)
    await schoolPatch(
      new NextRequest(`http://localhost/api/platform/schools/${schoolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", cookie: superAdmin.cookieHeader },
        body: JSON.stringify({ status: "ACTIVE", suspendedReason: null }),
      }),
      { params: Promise.resolve({ schoolId }) },
    );
    const okLoginRes = await loginPost(
      new NextRequest("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "password",
          identifier: principalEmail,
          password: principalPass,
          schoolSlug,
        }),
      }),
    );
    expect(okLoginRes.status).toBe(200);

    // 4. Add & update school user + revoke sessions
    const createUserRes = await schoolUsersPost(
      new NextRequest(`http://localhost/api/platform/schools/${schoolId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: superAdmin.cookieHeader },
        body: JSON.stringify({
          name: "Accountant Synthetic",
          email: `acc.${uniqueSuffix}@scholonix.example`,
          phone: `+9197${Math.floor(10000000 + Math.random() * 89999999)}`,
          password: ["Ax", uniqueSuffix, "9!"].join(""), // gitleaks:allow
          role: "ACCOUNTANT",
        }),
      }),
      { params: Promise.resolve({ schoolId }) },
    );
    expect(createUserRes.status).toBe(201);
    const accUser = (await createUserRes.json()).user;

    const listSchoolUsersRes = await schoolUsersGet(
      new NextRequest(`http://localhost/api/platform/schools/${schoolId}/users`, {
        headers: { cookie: superAdmin.cookieHeader },
      }),
      { params: Promise.resolve({ schoolId }) },
    );
    expect((await listSchoolUsersRes.json()).users).toHaveLength(2);

    const patchUserRes = await schoolUserPatch(
      new NextRequest(`http://localhost/api/platform/schools/${schoolId}/users/${accUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", cookie: superAdmin.cookieHeader },
        body: JSON.stringify({ role: "STAFF", revokeSessions: true }),
      }),
      { params: Promise.resolve({ schoolId, userId: accUser.id }) },
    );
    expect(patchUserRes.status).toBe(200);
    expect((await patchUserRes.json()).user.role).toBe("STAFF");

    const revokeGlobalRes = await globalUsersPatch(
      new NextRequest("http://localhost/api/platform/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", cookie: superAdmin.cookieHeader },
        body: JSON.stringify({ userId: accUser.id }),
      }),
    );
    expect(revokeGlobalRes.status).toBe(200);

    // 5. Inspect & mutate tenant admissions data safely via scoped transaction
    const createAppRes = await createAppPost(
      new NextRequest(`http://localhost/api/school/admissions/applications?schoolSlug=${schoolSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: superAdmin.cookieHeader },
        body: JSON.stringify({
          studentName: "Riya Synthetic",
          gradeApplied: "Class I",
          academicYear: "2026 – 2027",
          guardianName: "Meena Synthetic",
          guardianPhone: "+919876543210",
        }),
      }),
    );
    expect(createAppRes.status).toBe(201);
    const createdAppId = (await createAppRes.json()).application.id as string;

    const inspectRes = await schoolDataGet(
      new NextRequest(`http://localhost/api/platform/schools/${schoolId}/data`, {
        headers: { cookie: superAdmin.cookieHeader },
      }),
      { params: Promise.resolve({ schoolId }) },
    );
    expect(inspectRes.status).toBe(200);
    const inspectJson = await inspectRes.json();
    expect(inspectJson.data.applications.some((a: { id: string }) => a.id === createdAppId)).toBe(true);

    const mutateTenantRes = await schoolDataPatch(
      new NextRequest(`http://localhost/api/platform/schools/${schoolId}/data`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", cookie: superAdmin.cookieHeader },
        body: JSON.stringify({
          action: "update_application_status",
          applicationId: createdAppId,
          status: "SHORTLISTED",
        }),
      }),
      { params: Promise.resolve({ schoolId }) },
    );
    expect(mutateTenantRes.status).toBe(200);
    expect((await mutateTenantRes.json()).application.status).toBe("SHORTLISTED");

    // 6. Create & manage SaaS Invoice (exact paise + idempotency)
    const invKey = `inv-${uniqueSuffix}`;
    const invPost1 = await billingPost(
      new NextRequest("http://localhost/api/platform/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: superAdmin.cookieHeader },
        body: JSON.stringify({
          schoolId,
          idempotencyKey: invKey,
          plan: "ENTERPRISE",
          billingCycle: "MONTHLY",
          amountRupees: 7999,
          periodStart: "2026-11-01T00:00:00.000Z",
          periodEnd: "2026-12-01T00:00:00.000Z",
          status: "PENDING",
        }),
      }),
    );
    expect(invPost1.status).toBe(201);
    const invoice = (await invPost1.json()).invoice;
    expect(invoice.amountPaise).toBe(799_900);

    // Same idempotency key returns identical invoice
    const invPostDup = await billingPost(
      new NextRequest("http://localhost/api/platform/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: superAdmin.cookieHeader },
        body: JSON.stringify({
          schoolId,
          idempotencyKey: invKey,
          plan: "ENTERPRISE",
          billingCycle: "MONTHLY",
          amountRupees: 7999,
          periodStart: "2026-11-01T00:00:00.000Z",
          periodEnd: "2026-12-01T00:00:00.000Z",
          status: "PENDING",
        }),
      }),
    );
    expect((await invPostDup.json()).invoice.id).toBe(invoice.id);

    const invMarkPaid = await billingPatch(
      new NextRequest("http://localhost/api/platform/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", cookie: superAdmin.cookieHeader },
        body: JSON.stringify({ invoiceId: invoice.id, status: "PAID", paymentMode: "UPI" }),
      }),
    );
    expect(invMarkPaid.status).toBe(200);
    expect((await invMarkPaid.json()).invoice.status).toBe("PAID");

    // 7. Contact & Feedback persistence -> Support inbox triage
    const cRes = await contactPost(
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Rohan Inquiry",
          email: "rohan@scholonix.example",
          subject: "Enterprise onboarding demo",
          message: "We would like a product walkthrough for 3 school branches.",
        }),
      }),
    );
    expect(cRes.status).toBe(200);
    const fRes = await feedbackPost(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "Feature Request",
          rating: 5,
          feedback: "The customizable classwise fee & subject workbench is super helpful!",
        }),
      }),
    );
    expect(fRes.status).toBe(200);

    const ticketsRes = await supportGet(
      new NextRequest("http://localhost/api/platform/support", {
        headers: { cookie: superAdmin.cookieHeader },
      }),
    );
    const ticketsJson = await ticketsRes.json();
    expect(ticketsJson.tickets.length).toBeGreaterThanOrEqual(2);
    const firstTicket = ticketsJson.tickets[0];

    const resolveTicketRes = await supportPatch(
      new NextRequest("http://localhost/api/platform/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", cookie: superAdmin.cookieHeader },
        body: JSON.stringify({
          ticketId: firstTicket.id,
          status: "RESOLVED",
          resolutionNotes: "Demo scheduled",
        }),
      }),
    );
    expect(resolveTicketRes.status).toBe(200);
    expect((await resolveTicketRes.json()).ticket.status).toBe("RESOLVED");

    // 8. Announcements & Audit Logs & Overview
    const annCreate = await annPost(
      new NextRequest("http://localhost/api/platform/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: superAdmin.cookieHeader },
        body: JSON.stringify({
          title: "Scheduled Maintenance Window",
          message: "Routine database maintenance on Sunday 02:00 IST.",
          severity: "MAINTENANCE",
        }),
      }),
    );
    expect(annCreate.status).toBe(201);
    const annId = (await annCreate.json()).announcement.id as string;

    const annToggle = await annPatch(
      new NextRequest("http://localhost/api/platform/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", cookie: superAdmin.cookieHeader },
        body: JSON.stringify({ announcementId: annId, isActive: false }),
      }),
    );
    expect((await annToggle.json()).announcement.isActive).toBe(false);

    const annDel = await annDelete(
      new NextRequest(`http://localhost/api/platform/announcements?id=${annId}`, {
        method: "DELETE",
        headers: { cookie: superAdmin.cookieHeader },
      }),
    );
    expect(annDel.status).toBe(200);

    const overviewRes = await overviewGet(
      new NextRequest("http://localhost/api/platform/overview?days=7", {
        headers: { cookie: superAdmin.cookieHeader },
      }),
    );
    expect(overviewRes.status).toBe(200);
    const ovJson = await overviewRes.json();
    expect(ovJson.data.periodDays).toBe(7);
    expect(ovJson.data.kpis.totalSchools).toBeGreaterThanOrEqual(1);
    expect(ovJson.data.kpis.mrrPaise).toBeGreaterThanOrEqual(0);
    expect(ovJson.data.kpis.saasRevenueCollectedPaise).toBeGreaterThanOrEqual(799_900);
    expect(Array.isArray(ovJson.data.subscriptionBreakdown)).toBe(true);
    expect(ovJson.data.dailySignupTrend.length).toBe(7);
    expect(Array.isArray(ovJson.data.recentRegistrations)).toBe(true);
    expect(Array.isArray(ovJson.data.recentOpenTickets)).toBe(true);

    // 9. Delete synthetic school cleanly
    const delSchoolRes = await schoolDelete(
      new NextRequest(`http://localhost/api/platform/schools/${schoolId}`, {
        method: "DELETE",
        headers: { cookie: superAdmin.cookieHeader },
      }),
      { params: Promise.resolve({ schoolId }) },
    );
    expect(delSchoolRes.status).toBe(200);
  });

  it("authenticates dedicated platform_admins accounts separately from school users and enforces SUPER_ADMIN team management", async () => {
    const unique = randomBytes(3).toString("hex");
    const founderEmail = `founder.${unique}@company.example`;
    const founderTempPass = ["Ft", unique, "99!"].join(""); // gitleaks:allow
    const founderNewPass = ["Fn", unique, "#2026!"].join(""); // gitleaks:allow

    // Bootstrap first SUPER_ADMIN directly in isolated platform_admins store
    const founder = await platformAdminAuthService.createAdmin("bootstrap", {
      name: "Company Founder",
      email: founderEmail,
      phone: "+919876500999",
      password: founderTempPass,
      role: "SUPER_ADMIN",
      department: "Executive",
    });
    expect(founder.role).toBe("SUPER_ADMIN");
    expect(founder.mustChangePassword).toBe(true);
    expect(founder.twoFactorEnabled).toBe(false);

    // First-time sign in via dedicated /api/platform/auth/login
    const loginRes = await platformLoginPost(
      new NextRequest("http://localhost/api/platform/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: founderEmail, password: founderTempPass }),
      }),
    );
    expect(loginRes.status).toBe(200);
    const loginJson = await loginRes.json();
    expect(loginJson.requiresPasswordChange).toBe(true);
    const cookieHeader = loginRes.headers.get("set-cookie") || "";
    const cookieMatch = cookieHeader.match(new RegExp(`${getPlatformAdminCookieName()}=([^;]+)`));
    expect(cookieMatch).toBeTruthy();
    const founderCookie = `${getPlatformAdminCookieName()}=${cookieMatch![1]}`;

    // Before changing initial password & enrolling MFA, protected /api/platform/* routes MUST return 403 ADMIN_SETUP_REQUIRED
    const blockedAdminsRes = await adminsGet(
      new NextRequest("http://localhost/api/platform/admins", {
        headers: { cookie: founderCookie },
      }),
    );
    expect(blockedAdminsRes.status).toBe(403);
    expect((await blockedAdminsRes.json()).error.code).toBe("ADMIN_SETUP_REQUIRED");

    // Step 1: Complete mandatory password change
    const chPwdRes = await platformChangePwdPost(
      new NextRequest("http://localhost/api/platform/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: founderCookie },
        body: JSON.stringify({
          currentPassword: founderTempPass,
          newPassword: founderNewPass,
          confirmPassword: founderNewPass,
        }),
      }),
    );
    expect(chPwdRes.status).toBe(200);
    const chPwdJson = await chPwdRes.json();
    expect(chPwdJson.admin.mustChangePassword).toBe(false);
    expect(chPwdJson.requiresContactVerification).toBe(true);

    // Cannot skip Email & Phone verification to reach TOTP enrollment
    const prematureTotp = await platformTotpGet(
      new NextRequest("http://localhost/api/platform/auth/mfa/totp", {
        headers: { cookie: founderCookie },
      }),
    );
    expect(prematureTotp.status).toBe(400);

    // Step 2: Verify Email & Phone number via OTP
    const emailOtp = "654321";
    const phoneOtp = "123789";
    try {
      setOtpGeneratorForTesting(() => emailOtp);
      const sendEmailOtp = await platformContactSendPost(
        new NextRequest("http://localhost/api/platform/auth/verify-contact/send", {
          method: "POST",
          headers: { "Content-Type": "application/json", cookie: founderCookie },
          body: JSON.stringify({ channel: "EMAIL" }),
        }),
      );
      expect(sendEmailOtp.status).toBe(200);

      const verifyEmailOtp = await platformContactVerifyPost(
        new NextRequest("http://localhost/api/platform/auth/verify-contact/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json", cookie: founderCookie },
          body: JSON.stringify({ channel: "EMAIL", code: emailOtp }),
        }),
      );
      expect(verifyEmailOtp.status).toBe(200);
      expect((await verifyEmailOtp.json()).requiresContactVerification).toBe(true);

      setOtpGeneratorForTesting(() => phoneOtp);
      const sendPhoneOtp = await platformContactSendPost(
        new NextRequest("http://localhost/api/platform/auth/verify-contact/send", {
          method: "POST",
          headers: { "Content-Type": "application/json", cookie: founderCookie },
          body: JSON.stringify({ channel: "SMS", phone: "+919876500999" }),
        }),
      );
      expect(sendPhoneOtp.status).toBe(200);

      const verifyPhoneOtp = await platformContactVerifyPost(
        new NextRequest("http://localhost/api/platform/auth/verify-contact/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json", cookie: founderCookie },
          body: JSON.stringify({ channel: "SMS", code: phoneOtp, phone: "+919876500999" }),
        }),
      );
      expect(verifyPhoneOtp.status).toBe(200);
      const verifyPhoneJson = await verifyPhoneOtp.json();
      expect(verifyPhoneJson.requiresContactVerification).toBe(false);
      expect(verifyPhoneJson.requiresMfaSetup).toBe(true);
    } finally {
      setOtpGeneratorForTesting(undefined);
    }

    // Still blocked until 2FA or Passkey is enrolled
    const stillBlockedRes = await adminsGet(
      new NextRequest("http://localhost/api/platform/admins", {
        headers: { cookie: founderCookie },
      }),
    );
    expect(stillBlockedRes.status).toBe(403);

    // Step 2: Enroll TOTP 2FA using real RFC 6238 code
    const totpStartRes = await platformTotpGet(
      new NextRequest("http://localhost/api/platform/auth/mfa/totp", {
        headers: { cookie: founderCookie },
      }),
    );
    expect(totpStartRes.status).toBe(200);
    const { secret, otpauthUri } = await totpStartRes.json();
    expect(otpauthUri).toContain("otpauth://totp/");

    const liveCode = generateTotpCode(secret);
    const totpConfirmRes = await platformTotpPost(
      new NextRequest("http://localhost/api/platform/auth/mfa/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: founderCookie },
        body: JSON.stringify({ secret, code: liveCode }),
      }),
    );
    expect(totpConfirmRes.status).toBe(200);
    const { recoveryCodes } = await totpConfirmRes.json();
    expect(recoveryCodes).toHaveLength(8);

    // Register a real ECDSA P-256 WebAuthn Passkey and verify passwordless Passkey login
    const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
    const spkiBase64Url = (publicKey.export({ type: "spki", format: "der" }) as Buffer).toString(
      "base64url",
    );
    const regChalRes = await platformPasskeyChallengePost(
      new NextRequest("http://localhost/api/platform/auth/passkey/challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: founderCookie,
          host: "localhost:3000",
        },
        body: JSON.stringify({ purpose: "register" }),
      }),
    );
    expect(regChalRes.status).toBe(200);
    const regChal = await regChalRes.json();
    const credentialId = `cred-${unique}`;
    const regClientData = Buffer.from(
      JSON.stringify({
        type: "webauthn.create",
        challenge: regChal.challenge,
        origin: "http://localhost:3000",
      }),
    ).toString("base64url");
    const regPkRes = await platformPasskeyRegisterPost(
      new NextRequest("http://localhost/api/platform/auth/passkey/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: founderCookie,
          host: "localhost:3000",
        },
        body: JSON.stringify({
          challengeToken: regChal.challengeToken,
          credentialId,
          publicKeySpki: spkiBase64Url,
          algorithm: -7,
          deviceName: "Test Security Key",
          clientDataJSON: regClientData,
        }),
      }),
    );
    expect(regPkRes.status).toBe(201);

    // Founder creates a SUPPORT_AGENT in platform_admins
    const agentEmail = `support.${unique}@company.example`;
    const agentTempPass = `Support!${unique}99`;
    const agentNewPass = `SupportNew!${unique}#2026`;
    const createAgentRes = await adminsPost(
      new NextRequest("http://localhost/api/platform/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: founderCookie },
        body: JSON.stringify({
          name: "Support Agent",
          email: agentEmail,
          role: "SUPPORT_AGENT",
          password: agentTempPass,
          department: "Customer Success",
        }),
      }),
    );
    expect(createAgentRes.status).toBe(201);
    const agent = (await createAgentRes.json()).admin;

    // Founder cannot delete self
    const selfDelRes = await adminsDelete(
      new NextRequest(`http://localhost/api/platform/admins?id=${founder.id}`, {
        method: "DELETE",
        headers: { cookie: founderCookie },
      }),
    );
    expect(selfDelRes.status).toBe(400);

    // Support agent logs in via /api/platform/auth/login -> changes password -> enrolls TOTP
    const agentLoginRes = await platformLoginPost(
      new NextRequest("http://localhost/api/platform/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: agentEmail, password: agentTempPass }),
      }),
    );
    expect(agentLoginRes.status).toBe(200);
    const agentMatch = (agentLoginRes.headers.get("set-cookie") || "").match(
      new RegExp(`${getPlatformAdminCookieName()}=([^;]+)`),
    );
    const agentCookie = `${getPlatformAdminCookieName()}=${agentMatch![1]}`;

    await platformChangePwdPost(
      new NextRequest("http://localhost/api/platform/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: agentCookie },
        body: JSON.stringify({
          currentPassword: agentTempPass,
          newPassword: agentNewPass,
          confirmPassword: agentNewPass,
        }),
      }),
    );
    try {
      setOtpGeneratorForTesting(() => "445566");
      await platformContactSendPost(
        new NextRequest("http://localhost/api/platform/auth/verify-contact/send", {
          method: "POST",
          headers: { "Content-Type": "application/json", cookie: agentCookie },
          body: JSON.stringify({ channel: "EMAIL" }),
        }),
      );
      await platformContactVerifyPost(
        new NextRequest("http://localhost/api/platform/auth/verify-contact/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json", cookie: agentCookie },
          body: JSON.stringify({ channel: "EMAIL", code: "445566" }),
        }),
      );
      await platformContactSendPost(
        new NextRequest("http://localhost/api/platform/auth/verify-contact/send", {
          method: "POST",
          headers: { "Content-Type": "application/json", cookie: agentCookie },
          body: JSON.stringify({ channel: "SMS", phone: "+919876500888" }),
        }),
      );
      await platformContactVerifyPost(
        new NextRequest("http://localhost/api/platform/auth/verify-contact/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json", cookie: agentCookie },
          body: JSON.stringify({ channel: "SMS", code: "445566", phone: "+919876500888" }),
        }),
      );
    } finally {
      setOtpGeneratorForTesting(undefined);
    }
    const agentTotpStart = await (
      await platformTotpGet(
        new NextRequest("http://localhost/api/platform/auth/mfa/totp", {
          headers: { cookie: agentCookie },
        }),
      )
    ).json();
    await platformTotpPost(
      new NextRequest("http://localhost/api/platform/auth/mfa/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: agentCookie },
        body: JSON.stringify({
          secret: agentTotpStart.secret,
          code: generateTotpCode(agentTotpStart.secret),
        }),
      }),
    );

    // SUPPORT_AGENT can list team & overview, but is FORBIDDEN (403) from creating/updating/deleting platform_admins
    const listAdminsRes = await adminsGet(
      new NextRequest("http://localhost/api/platform/admins", {
        headers: { cookie: agentCookie },
      }),
    );
    expect(listAdminsRes.status).toBe(200);
    expect((await listAdminsRes.json()).admins.length).toBeGreaterThanOrEqual(2);

    const forbiddenCreate = await adminsPost(
      new NextRequest("http://localhost/api/platform/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: agentCookie },
        body: JSON.stringify({
          name: "Unauthorized Escalation",
          email: `escalate.${unique}@company.example`,
          role: "SUPER_ADMIN",
          password: `Escalate!${unique}99`,
        }),
      }),
    );
    expect(forbiddenCreate.status).toBe(403);

    // Test returning login with Recovery Code AND Passkey assertion
    const reloginRes = await platformLoginPost(
      new NextRequest("http://localhost/api/platform/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: founderEmail, password: founderNewPass }),
      }),
    );
    expect((await reloginRes.json()).requiresMfaChallenge).toBe(true);
    const reloginCookie = `${getPlatformAdminCookieName()}=${(reloginRes.headers.get("set-cookie") || "").match(new RegExp(`${getPlatformAdminCookieName()}=([^;]+)`))![1]}`;

    const recoveryVerifyRes = await platformMfaVerifyPost(
      new NextRequest("http://localhost/api/platform/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: reloginCookie },
        body: JSON.stringify({ code: recoveryCodes[0] }),
      }),
    );
    expect(recoveryVerifyRes.status).toBe(200);
    expect((await recoveryVerifyRes.json()).usedRecoveryCode).toBe(true);

    // Passwordless Passkey Login
    const authChal = await (
      await platformPasskeyChallengePost(
        new NextRequest("http://localhost/api/platform/auth/passkey/challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json", host: "localhost:3000" },
          body: JSON.stringify({ purpose: "authenticate", email: founderEmail }),
        }),
      )
    ).json();
    const authClientDataBytes = Buffer.from(
      JSON.stringify({
        type: "webauthn.get",
        challenge: authChal.challenge,
        origin: "http://localhost:3000",
      }),
    );
    const rpIdHash = createHash("sha256").update("localhost").digest();
    const flagsAndCounter = Buffer.alloc(5);
    flagsAndCounter[0] = 0x05; // UP + UV
    flagsAndCounter.writeUInt32BE(1, 1);
    const authenticatorData = Buffer.concat([rpIdHash, flagsAndCounter]);
    const clientDataHash = createHash("sha256").update(authClientDataBytes).digest();
    const sig = cryptoSign("sha256", Buffer.concat([authenticatorData, clientDataHash]), privateKey);

    const passkeyVerifyRes = await platformPasskeyVerifyPost(
      new NextRequest("http://localhost/api/platform/auth/passkey/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", host: "localhost:3000" },
        body: JSON.stringify({
          challengeToken: authChal.challengeToken,
          credentialId,
          clientDataJSON: authClientDataBytes.toString("base64url"),
          authenticatorData: authenticatorData.toString("base64url"),
          signature: sig.toString("base64url"),
        }),
      }),
    );
    expect(passkeyVerifyRes.status).toBe(200);

    // Founder suspends & deletes agent cleanly
    const patchAgent = await adminsPatch(
      new NextRequest("http://localhost/api/platform/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", cookie: founderCookie },
        body: JSON.stringify({ adminId: agent.id, status: "SUSPENDED", revokeSessions: true }),
      }),
    );
    expect(patchAgent.status).toBe(200);

    const delAgent = await adminsDelete(
      new NextRequest(`http://localhost/api/platform/admins?id=${agent.id}`, {
        method: "DELETE",
        headers: { cookie: founderCookie },
      }),
    );
    expect(delAgent.status).toBe(200);

    // Logout clears session cookie
    const logoutRes = await platformLogoutPost(
      new NextRequest("http://localhost/api/platform/auth/logout", {
        method: "POST",
        headers: { cookie: founderCookie },
      }),
    );
    expect(logoutRes.status).toBe(200);
  });
});
