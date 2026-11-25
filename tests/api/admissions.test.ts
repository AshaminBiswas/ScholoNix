import { randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET as overviewGet } from "@/app/api/school/admissions/overview/route";
import {
  GET as applicationsGet,
  POST as applicationsPost,
} from "@/app/api/school/admissions/applications/route";
import {
  GET as applicationByIdGet,
  PATCH as applicationByIdPatch,
} from "@/app/api/school/admissions/applications/[applicationId]/route";
import { POST as enquiriesPost } from "@/app/api/school/admissions/enquiries/route";
import { PATCH as enquiryPatch } from "@/app/api/school/admissions/enquiries/[enquiryId]/route";
import { GET as exportCsvGet } from "@/app/api/school/admissions/export/route";
import { PATCH as settingsPatch } from "@/app/api/school/admissions/settings/route";
import { POST as reminderPost } from "@/app/api/school/admissions/reminders/route";
import { authRepository } from "@/server/auth/auth-repository";
import { getSessionCookieName, sessionService } from "@/server/auth/session-service";
import { hashPassword } from "@/server/security/crypto";

async function createSchoolUser(tag: string, role: string) {
  const unique = `${tag}-${Date.now()}-${randomBytes(3).toString("hex")}`.toLowerCase();
  const passwordHash = await hashPassword(`Adm!${randomBytes(8).toString("hex")}9`);

  return authRepository.createUserWithSchool({
    school: {
      name: `Admissions School ${tag} ${unique}`,
      slug: `adm-school-${unique}`,
      code: `AS-${randomBytes(3).toString("hex").toUpperCase()}`,
      category: "Co-Educational School",
      affiliationBoard: "CBSE",
      city: "Pune",
      state: "Maharashtra",
      pinCode: "411001",
      country: "India",
    },
    user: {
      name: `User ${tag}`,
      email: `adm.${unique}@scholonix.example`,
      phone: `+9196${Math.floor(10000000 + Math.random() * 89999999)}`,
      passwordHash,
      role,
      phoneVerified: true,
      emailVerified: true,
    },
  });
}

describe("Admissions API: Dynamic CRUD, Analytics, CSV Export, RBAC & Multi-Tenant Isolation", () => {
  it("rejects unauthenticated requests with 401", async () => {
    const res = await overviewGet(new NextRequest("http://localhost/api/school/admissions/overview"));
    expect(res.status).toBe(401);
  });

  it("enforces role permissions (TEACHER/STUDENT blocked; STAFF allowed read/write but denied export/settings)", async () => {
    const { user: admin } = await createSchoolUser("RbacAdmin", "PRINCIPAL");
    const { user: teacher } = await createSchoolUser("Teacher", "TEACHER");
    const { user: student } = await createSchoolUser("Student", "STUDENT");
    const { user: staff } = await createSchoolUser("Staff", "STAFF");

    const cookieName = getSessionCookieName();
    const teacherSession = await sessionService.createSession(teacher);
    const studentSession = await sessionService.createSession(student);
    const staffSession = await sessionService.createSession(staff);
    const adminSession = await sessionService.createSession(admin);

    const teacherRes = await overviewGet(
      new NextRequest("http://localhost/api/school/admissions/overview", {
        headers: { cookie: `${cookieName}=${teacherSession.token}` },
      }),
    );
    expect(teacherRes.status).toBe(403);

    const studentRes = await overviewGet(
      new NextRequest("http://localhost/api/school/admissions/overview", {
        headers: { cookie: `${cookieName}=${studentSession.token}` },
      }),
    );
    expect(studentRes.status).toBe(403);

    const staffOverview = await overviewGet(
      new NextRequest("http://localhost/api/school/admissions/overview", {
        headers: { cookie: `${cookieName}=${staffSession.token}` },
      }),
    );
    expect(staffOverview.status).toBe(200);

    const staffExportAttempt = await exportCsvGet(
      new NextRequest("http://localhost/api/school/admissions/export", {
        headers: { cookie: `${cookieName}=${staffSession.token}` },
      }),
    );
    expect(staffExportAttempt.status).toBe(403);

    const staffSettingsAttempt = await settingsPatch(
      new NextRequest("http://localhost/api/school/admissions/settings", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: `${cookieName}=${staffSession.token}`,
        },
        body: JSON.stringify({
          currentAcademicYear: "2026 – 2027",
          applicationPrefix: "SCH",
          enabledGrades: ["Class I"],
        }),
      }),
    );
    expect(staffSettingsAttempt.status).toBe(403);

    const adminSettings = await settingsPatch(
      new NextRequest("http://localhost/api/school/admissions/settings", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: `${cookieName}=${adminSession.token}`,
        },
        body: JSON.stringify({
          currentAcademicYear: "2026 – 2027",
          applicationDeadline: "2026-06-30",
          applicationPrefix: "SYN",
          enabledGrades: ["Nursery", "Class I"],
        }),
      }),
    );
    expect(adminSettings.status).toBe(200);
  });

  it("persists dynamic enquiry -> convert -> verify -> shortlist -> admit workflow and blocks cross-tenant access", async () => {
    const { school: schoolA, user: adminA } = await createSchoolUser("SchoolA", "SCHOOL_ADMIN");
    const { user: adminB } = await createSchoolUser("SchoolB", "SCHOOL_ADMIN");

    const cookieName = getSessionCookieName();
    const sessionA = await sessionService.createSession(adminA);
    const sessionB = await sessionService.createSession(adminB);
    const cookieA = `${cookieName}=${sessionA.token}`;
    const cookieB = `${cookieName}=${sessionB.token}`;

    // 1. Fresh tenant starts strictly at zero with no dummy data
    const initialOverview = await overviewGet(
      new NextRequest("http://localhost/api/school/admissions/overview", {
        headers: { cookie: cookieA },
      }),
    );
    expect(initialOverview.status).toBe(200);
    const initialJson = await initialOverview.json();
    expect(initialJson.data.kpis.totalApplications.value).toBe(0);
    expect(initialJson.data.applications).toEqual([]);
    expect(initialJson.data.enquiries).toEqual([]);

    // 2. Log a real enquiry for School A
    const enqRes = await enquiriesPost(
      new NextRequest("http://localhost/api/school/admissions/enquiries", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: cookieA },
        body: JSON.stringify({
          studentName: "Synthetic Applicant One",
          guardianName: "Synthetic Parent One",
          guardianPhone: "+919800000011",
          guardianEmail: "parent.one@scholonix.example",
          gradeApplied: "Class I",
          academicYear: initialJson.data.settings.currentAcademicYear,
          source: "Walk-In",
          notes: "Walked in for Class I admission",
        }),
      }),
    );
    expect(enqRes.status).toBe(201);
    const enqJson = await enqRes.json();
    const enquiryId = enqJson.enquiry.id as string;

    // 3. Convert enquiry to application atomically
    const convertRes = await enquiryPatch(
      new NextRequest(`http://localhost/api/school/admissions/enquiries/${enquiryId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", cookie: cookieA },
        body: JSON.stringify({ action: "convert" }),
      }),
      { params: Promise.resolve({ enquiryId }) },
    );
    expect(convertRes.status).toBe(200);
    const convertJson = await convertRes.json();
    expect(convertJson.enquiry.status).toBe("CONVERTED");
    const appId = convertJson.application.id as string;
    expect(convertJson.application.applicationCode).toMatch(/^APP/);

    // 4. Create a second direct application
    const app2Res = await applicationsPost(
      new NextRequest("http://localhost/api/school/admissions/applications", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: cookieA },
        body: JSON.stringify({
          studentName: "Synthetic Applicant Two",
          gradeApplied: "Nursery",
          academicYear: initialJson.data.settings.currentAcademicYear,
          guardianName: "Synthetic Parent Two",
          guardianPhone: "+919800000022",
          status: "SHORTLISTED",
        }),
      }),
    );
    expect(app2Res.status).toBe(201);

    // 5. Verify docs and Admit Application #1
    const admitRes = await applicationByIdPatch(
      new NextRequest(`http://localhost/api/school/admissions/applications/${appId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", cookie: cookieA },
        body: JSON.stringify({
          status: "ADMITTED",
          verificationStatus: "VERIFIED",
          verificationNotes: "All original documents checked.",
        }),
      }),
      { params: Promise.resolve({ applicationId: appId }) },
    );
    expect(admitRes.status).toBe(200);
    const admitJson = await admitRes.json();
    expect(admitJson.application.status).toBe("ADMITTED");
    expect(admitJson.application.verificationStatus).toBe("VERIFIED");
    expect(admitJson.application.admissionNumber).toMatch(/^ADM/);

    // 6. Add custom reminder
    const remRes = await reminderPost(
      new NextRequest("http://localhost/api/school/admissions/reminders", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: cookieA },
        body: JSON.stringify({
          title: "Issue welcome kit for admitted batch",
          priority: "INFO",
        }),
      }),
    );
    expect(remRes.status).toBe(201);

    // 7. Verify live computed overview metrics for School A
    const liveOverview = await overviewGet(
      new NextRequest("http://localhost/api/school/admissions/overview", {
        headers: { cookie: cookieA },
      }),
    );
    const liveJson = await liveOverview.json();
    expect(liveJson.data.kpis.totalApplications.value).toBe(2);
    expect(liveJson.data.kpis.shortlisted.value).toBe(1);
    expect(liveJson.data.kpis.admitted.value).toBe(1);
    expect(liveJson.data.kpis.conversionRate.rate).toBe(50);
    expect(liveJson.data.funnel.enquiries).toBe(1);
    expect(liveJson.data.activities.length).toBeGreaterThanOrEqual(3);
    expect(liveJson.data.admittedStudents).toHaveLength(1);

    // 8. Export CSV for School A
    const csvRes = await exportCsvGet(
      new NextRequest("http://localhost/api/school/admissions/export", {
        headers: { cookie: cookieA },
      }),
    );
    expect(csvRes.status).toBe(200);
    expect(csvRes.headers.get("content-type")).toContain("text/csv");
    const csvText = await csvRes.text();
    expect(csvText).toContain("Synthetic Applicant One");
    expect(csvText).toContain(admitJson.application.admissionNumber);

    // 9. Cross-Tenant Isolation: School B CANNOT read, list, update, or export School A records
    const crossList = await applicationsGet(
      new NextRequest("http://localhost/api/school/admissions/applications", {
        headers: { cookie: cookieB },
      }),
    );
    expect(crossList.status).toBe(200);
    const crossListJson = await crossList.json();
    expect(crossListJson.applications).toEqual([]);

    const crossOverviewOverride = await overviewGet(
      new NextRequest(
        `http://localhost/api/school/admissions/overview?schoolId=${encodeURIComponent(schoolA.id)}`,
        { headers: { cookie: cookieB } },
      ),
    );
    expect(crossOverviewOverride.status).toBe(403);

    const crossGetById = await applicationByIdGet(
      new NextRequest(`http://localhost/api/school/admissions/applications/${appId}`, {
        headers: { cookie: cookieB },
      }),
      { params: Promise.resolve({ applicationId: appId }) },
    );
    expect(crossGetById.status).toBe(404);

    const crossPatch = await applicationByIdPatch(
      new NextRequest(`http://localhost/api/school/admissions/applications/${appId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", cookie: cookieB },
        body: JSON.stringify({ status: "REJECTED" }),
      }),
      { params: Promise.resolve({ applicationId: appId }) },
    );
    expect(crossPatch.status).toBe(404);

    const crossCsv = await exportCsvGet(
      new NextRequest(
        `http://localhost/api/school/admissions/export?schoolSlug=${encodeURIComponent(schoolA.slug)}`,
        { headers: { cookie: cookieB } },
      ),
    );
    expect(crossCsv.status).toBe(403);

    const ownBCsv = await exportCsvGet(
      new NextRequest("http://localhost/api/school/admissions/export", {
        headers: { cookie: cookieB },
      }),
    );
    expect(ownBCsv.status).toBe(200);
    expect(await ownBCsv.text()).not.toContain("Synthetic Applicant One");
  });
});
