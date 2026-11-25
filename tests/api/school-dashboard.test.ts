import { randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET as dashboardGet } from "@/app/api/school/dashboard/route";
import { GET as schoolsGet } from "@/app/api/school/schools/route";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { authRepository } from "@/server/auth/auth-repository";
import { getSessionCookieName, sessionService } from "@/server/auth/session-service";
import { hashPassword } from "@/server/security/crypto";
import { schoolDashboardService } from "@/server/school/school-dashboard-service";
import { TenantMismatchError, TenantNotFoundError } from "@/lib/errors";

async function createTenantAdmin(tag: string, role: string = "SCHOOL_ADMIN") {
  const unique = `${tag}-${Date.now()}-${randomBytes(3).toString("hex")}`;
  const passphrase = `Tenant!${randomBytes(8).toString("hex")}5`;
  const passwordHash = await hashPassword(passphrase);

  return authRepository.createUserWithSchool({
    school: {
      name: `Tenant School ${unique}`,
      slug: `tenant-school-${unique.toLowerCase()}`,
      code: `TS-${randomBytes(3).toString("hex").toUpperCase()}`,
      category: "Co-Educational School",
      affiliationBoard: "CBSE",
      city: "Bengaluru",
      state: "Karnataka",
      pinCode: "560001",
      country: "India",
    },
    user: {
      name: `Admin ${tag}`,
      email: `admin.${unique.toLowerCase()}@scholonix.example`,
      phone: `+9198${Math.floor(10000000 + Math.random() * 89999999)}`,
      passwordHash,
      role,
      phoneVerified: true,
      emailVerified: true,
    },
  });
}

describe("School Dashboard API & Strict Tenant Isolation", () => {
  it("rejects unauthenticated requests to /api/school/dashboard (even with demo=true) and /api/school/schools", async () => {
    const dashRes = await dashboardGet(
      new NextRequest("http://localhost/api/school/dashboard"),
    );
    expect(dashRes.status).toBe(401);

    const demoBypassAttempt = await dashboardGet(
      new NextRequest("http://localhost/api/school/dashboard?demo=true&schoolId=sch_test_nonexistent"),
    );
    expect(demoBypassAttempt.status).toBe(401);

    const schoolsRes = await schoolsGet(
      new NextRequest("http://localhost/api/school/schools"),
    );
    expect(schoolsRes.status).toBe(401);
  });

  it("returns only the authenticated tenant's real school and zero-initialized metrics without hardcoded demo data", async () => {
    const { school: schoolA, user: userA } = await createTenantAdmin("Alpha");
    const { school: schoolB } = await createTenantAdmin("Beta");
    const sessionA = await sessionService.createSession(userA);
    const cookieName = getSessionCookieName();

    const res = await dashboardGet(
      new NextRequest("http://localhost/api/school/dashboard", {
        headers: { cookie: `${cookieName}=${sessionA.token}` },
      }),
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.school.id).toBe(schoolA.id);
    expect(json.data.school.name).toBe(schoolA.name);
    expect(json.data.currentUser.name).toBe(userA.name);

    // No hardcoded demo numbers or sample student names
    expect(json.data.kpis.totalStudents.value).toBe(0);
    expect(json.data.kpis.totalStaff.value).toBe(0);
    expect(json.data.kpis.feeDues.value).toBe(0);
    expect(json.data.feeCollection.totalFee).toBe(0);
    expect(json.data.recentAdmissions).toEqual([]);
    expect(json.data.upcomingEvents).toEqual([]);
    expect(json.data.notices).toEqual([]);

    // Tenant isolation: only own school returned in availableSchools and /api/school/schools
    expect(json.availableSchools).toHaveLength(1);
    expect(json.availableSchools[0].id).toBe(schoolA.id);

    const schoolsRes = await schoolsGet(
      new NextRequest("http://localhost/api/school/schools", {
        headers: { cookie: `${cookieName}=${sessionA.token}` },
      }),
    );
    expect(schoolsRes.status).toBe(200);
    const schoolsJson = await schoolsRes.json();
    expect(schoolsJson.schools).toHaveLength(1);
    expect(schoolsJson.schools[0].id).toBe(schoolA.id);
    expect(schoolsJson.schools.some((s: { id: string }) => s.id === schoolB.id)).toBe(false);
  });

  it("blocks cross-tenant access when a school user passes another schoolId", async () => {
    const { user: userA } = await createTenantAdmin("CrossA");
    const { school: schoolB } = await createTenantAdmin("CrossB");
    const sessionA = await sessionService.createSession(userA);
    const cookieName = getSessionCookieName();

    const forbiddenRes = await dashboardGet(
      new NextRequest(`http://localhost/api/school/dashboard?schoolId=${encodeURIComponent(schoolB.id)}`, {
        headers: { cookie: `${cookieName}=${sessionA.token}` },
      }),
    );
    expect(forbiddenRes.status).toBe(403);

    await expect(
      schoolDashboardService.getDashboardData(schoolB.id, userA.id),
    ).rejects.toBeInstanceOf(TenantMismatchError);

    await expect(
      schoolDashboardService.getDashboardData("nonexistent_school_id", userA.id),
    ).rejects.toBeInstanceOf(TenantNotFoundError);
  });

  it("allows PLATFORM_SUPER_ADMIN to query schools across tenants", async () => {
    const { user: superAdmin } = await createTenantAdmin("Super", "PLATFORM_SUPER_ADMIN");
    const { school: targetSchool } = await createTenantAdmin("Target");
    const superSession = await sessionService.createSession(superAdmin);
    const cookieName = getSessionCookieName();

    const res = await dashboardGet(
      new NextRequest(
        `http://localhost/api/school/dashboard?schoolId=${encodeURIComponent(targetSchool.id)}`,
        { headers: { cookie: `${cookieName}=${superSession.token}` } },
      ),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.school.id).toBe(targetSchool.id);
    expect(json.availableSchools.some((s: { id: string }) => s.id === targetSchool.id)).toBe(true);
  });

  it("rejects cross-tenant schoolSlug overrides and returns school-specific redirectTo on login", async () => {
    const unique = `Login-${Date.now()}-${randomBytes(3).toString("hex")}`;
    const passphrase = `Login!${randomBytes(8).toString("hex")}7`;
    const passwordHash = await hashPassword(passphrase);
    const email = `login.${unique.toLowerCase()}@scholonix.example`;

    const { school: schoolA, user: userA } = await authRepository.createUserWithSchool({
      school: {
        name: `Login School ${unique}`,
        slug: `login-school-${unique.toLowerCase()}`,
        code: `LS-${randomBytes(3).toString("hex").toUpperCase()}`,
        category: "Co-Educational School",
        affiliationBoard: "CBSE",
        city: "Bengaluru",
        state: "Karnataka",
        pinCode: "560001",
        country: "India",
      },
      user: {
        name: "Login Test Admin",
        email,
        phone: `+9198${Math.floor(10000000 + Math.random() * 89999999)}`,
        passwordHash,
        role: "SCHOOL_ADMIN",
        phoneVerified: true,
        emailVerified: true,
      },
    });
    const { school: schoolB } = await createTenantAdmin("SlugCrossB");

    const loginRes = await loginPost(
      new NextRequest("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ method: "password", identifier: email, password: passphrase }),
      }),
    );
    expect(loginRes.status).toBe(200);
    const loginJson = await loginRes.json();
    expect(loginJson.data.school.slug).toBe(schoolA.slug);
    expect(loginJson.data.redirectTo).toBe(`/${schoolA.slug}`);

    const sessionA = await sessionService.createSession(userA);
    const cookieName = getSessionCookieName();
    const crossSlugRes = await dashboardGet(
      new NextRequest(
        `http://localhost/api/school/dashboard?schoolSlug=${encodeURIComponent(schoolB.slug)}`,
        { headers: { cookie: `${cookieName}=${sessionA.token}` } },
      ),
    );
    expect(crossSlugRes.status).toBe(403);

    const fastDash = await schoolDashboardService.getDashboardDataFromSession(schoolA, userA);
    expect(fastDash.data.school.id).toBe(schoolA.id);
    expect(fastDash.data.school.slug).toBe(schoolA.slug);

    await expect(
      schoolDashboardService.getDashboardDataFromSession(schoolB, userA),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });
});
