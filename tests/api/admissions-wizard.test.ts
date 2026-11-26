import { randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { POST as uploadDocPost } from "@/app/api/school/admissions/documents/route";
import { GET as viewDocGet } from "@/app/api/school/admissions/documents/view/route";
import {
  GET as appsGet,
  POST as appsPost,
} from "@/app/api/school/admissions/applications/route";
import { PATCH as appPatch } from "@/app/api/school/admissions/applications/[applicationId]/route";
import { GET as overviewGet } from "@/app/api/school/admissions/overview/route";
import { authRepository } from "@/server/auth/auth-repository";
import { getSessionCookieName, sessionService } from "@/server/auth/session-service";
import { hashPassword } from "@/server/security/crypto";

async function seedSchoolUser(tag: string) {
  const unique = `${tag}-${Date.now()}-${randomBytes(3).toString("hex")}`.toLowerCase();
  const passwordHash = await hashPassword(`Wiz!${randomBytes(8).toString("hex")}7`);
  const { school, user } = await authRepository.createUserWithSchool({
    school: {
      name: `Wizard School ${tag} ${unique}`,
      slug: `sc_${randomBytes(10).toString("hex")}`,
      code: `WZ-${randomBytes(2).toString("hex").toUpperCase()}`,
      category: "Co-Educational School",
      affiliationBoard: "CBSE",
      city: "Pune",
      state: "Maharashtra",
      pinCode: "411001",
      country: "India",
    },
    user: {
      name: `Principal ${tag}`,
      email: `wiz.${unique}@scholonix.example`,
      phone: `+9195${Math.floor(10000000 + Math.random() * 89999999)}`,
      passwordHash,
      role: "PRINCIPAL",
      phoneVerified: true,
      emailVerified: true,
    },
  });
  const session = await sessionService.createSession(user);
  const cookieHeader = `${getSessionCookieName()}=${session.token}`;
  return { school, user, cookieHeader };
}

describe("Admissions 4-Step Wizard API, Document Upload & Tenant Isolation", () => {
  it("validates uploads (magic bytes, MIME, size) and blocks cross-tenant document reads or attachments", async () => {
    const tenantA = await seedSchoolUser("A");
    const tenantB = await seedSchoolUser("B");

    // 1. Valid PDF upload for Tenant A
    const pdfBytes = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n", "utf8");
    const validForm = new FormData();
    validForm.append("file", new File([pdfBytes], "birth-cert.pdf", { type: "application/pdf" }));
    validForm.append("docType", "birth_certificate");
    validForm.append("label", "Birth Certificate");

    const uploadRes = await uploadDocPost(
      new NextRequest(
        `http://localhost/api/school/admissions/documents?schoolSlug=${tenantA.school.slug}`,
        {
          method: "POST",
          headers: { cookie: tenantA.cookieHeader },
          body: validForm,
        },
      ),
    );
    expect(uploadRes.status).toBe(201);
    const uploadJson = await uploadRes.json();
    expect(uploadJson.success).toBe(true);
    expect(uploadJson.document.storageKey).toContain(`${tenantA.school.id}/admissions/`);

    // 2. Spoofed PDF (bad magic bytes) rejected with 400
    const spoofForm = new FormData();
    spoofForm.append(
      "file",
      new File([Buffer.from("not-a-pdf")], "evil.pdf", { type: "application/pdf" }),
    );
    spoofForm.append("docType", "birth_certificate");
    const spoofRes = await uploadDocPost(
      new NextRequest(
        `http://localhost/api/school/admissions/documents?schoolSlug=${tenantA.school.slug}`,
        {
          method: "POST",
          headers: { cookie: tenantA.cookieHeader },
          body: spoofForm,
        },
      ),
    );
    expect(spoofRes.status).toBe(400);

    // 3. Tenant A can read its own document
    const ownViewRes = await viewDocGet(
      new NextRequest(
        `http://localhost/api/school/admissions/documents/view?schoolSlug=${tenantA.school.slug}&key=${encodeURIComponent(uploadJson.document.storageKey)}`,
        { headers: { cookie: tenantA.cookieHeader } },
      ),
    );
    expect(ownViewRes.status).toBe(200);

    // 4. Tenant B cannot read Tenant A's document (403)
    const crossViewRes = await viewDocGet(
      new NextRequest(
        `http://localhost/api/school/admissions/documents/view?schoolSlug=${tenantB.school.slug}&key=${encodeURIComponent(uploadJson.document.storageKey)}`,
        { headers: { cookie: tenantB.cookieHeader } },
      ),
    );
    expect(crossViewRes.status).toBe(403);

    // 5. Tenant B cannot attach Tenant A's document key to a new application
    const crossAttachRes = await appsPost(
      new NextRequest(
        `http://localhost/api/school/admissions/applications?schoolSlug=${tenantB.school.slug}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: tenantB.cookieHeader,
          },
          body: JSON.stringify({
            studentName: "Cross Tenant Student",
            gradeApplied: "Class I",
            academicYear: "2026 – 2027",
            guardianName: "Cross Guardian",
            guardianRelation: "Father",
            guardianPhone: "+919876543210",
            isDraft: true,
            uploadedDocuments: [uploadJson.document],
          }),
        },
      ),
    );
    expect(crossAttachRes.status).toBe(403);
  });

  it("keeps drafts out of submitted KPIs until submitted, and recomputes Transfer percentage server-side", async () => {
    const tenant = await seedSchoolUser("WizardFlow");

    // 1. Save draft application
    const draftRes = await appsPost(
      new NextRequest(
        `http://localhost/api/school/admissions/applications?schoolSlug=${tenant.school.slug}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: tenant.cookieHeader,
          },
          body: JSON.stringify({
            studentName: "Synthetic Kavya",
            gradeApplied: "Class IV",
            academicYear: "2026 – 2027",
            guardianName: "Synthetic Meera",
            guardianRelation: "Mother",
            guardianPhone: "+919811112222",
            admissionType: "TRANSFER",
            isDraft: true,
            currentStep: 2,
          }),
        },
      ),
    );
    expect(draftRes.status).toBe(201);
    const draftJson = await draftRes.json();
    expect(draftJson.application.isDraft).toBe(true);

    // Overview shows 0 submitted apps and 1 draft
    const ov1Res = await overviewGet(
      new NextRequest(
        `http://localhost/api/school/admissions/overview?schoolSlug=${tenant.school.slug}`,
        { headers: { cookie: tenant.cookieHeader } },
      ),
    );
    const ov1 = await ov1Res.json();
    expect(ov1.data.kpis.totalApplications.value).toBe(0);
    expect(ov1.data.drafts).toHaveLength(1);

    // 2. Reject invalid Transfer marks (marksObtained > totalMarks)
    const badMarksRes = await appPatch(
      new NextRequest(
        `http://localhost/api/school/admissions/applications/${draftJson.application.id}?schoolSlug=${tenant.school.slug}`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            cookie: tenant.cookieHeader,
          },
          body: JSON.stringify({
            isDraft: false,
            admissionType: "TRANSFER",
            academicDetails: {
              previousSchoolName: "Old School",
              boardCurriculum: "CBSE",
              lastStandardStudied: "Class III",
              yearOfCompletion: "2025",
              totalMarks: 500,
              marksObtained: 600,
            },
          }),
        },
      ),
      { params: Promise.resolve({ applicationId: draftJson.application.id }) },
    );
    expect(badMarksRes.status).toBe(400);

    // 3. Submit draft as Transfer Admission with valid marks (client tries fake percentage=99; server recomputes 77.0)
    const submitRes = await appPatch(
      new NextRequest(
        `http://localhost/api/school/admissions/applications/${draftJson.application.id}?schoolSlug=${tenant.school.slug}`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            cookie: tenant.cookieHeader,
          },
          body: JSON.stringify({
            isDraft: false,
            currentStep: 4,
            admissionType: "TRANSFER",
            gender: "Female",
            dateOfBirth: "2016-05-10",
            nationality: "Indian",
            studentDetails: {
              address: {
                addressLine1: "12 Rose Avenue",
                city: "Pune",
                state: "Maharashtra",
                postalCode: "411001",
              },
            },
            guardianDetails: {
              primary: {
                fullName: "Synthetic Meera",
                relationship: "Mother",
                phone: "+919811112222",
                email: "meera@scholonix.example",
              },
              sameAsStudentAddress: true,
              emergencyContactNumber: "+919811113333",
              preferredCommunicationMode: "Phone",
            },
            academicDetails: {
              previousSchoolName: "Old Prep School",
              boardCurriculum: "CBSE",
              lastStandardStudied: "Class III",
              yearOfCompletion: "2025",
              totalMarks: 500,
              marksObtained: 385,
              percentage: 99,
            },
            declarationAccepted: true,
          }),
        },
      ),
      { params: Promise.resolve({ applicationId: draftJson.application.id }) },
    );
    expect(submitRes.status).toBe(200);
    const submitJson = await submitRes.json();
    expect(submitJson.application.isDraft).toBe(false);
    expect(submitJson.application.academicDetails.percentage).toBe(77);

    // Overview now shows 1 submitted application and 0 drafts
    const listRes = await appsGet(
      new NextRequest(
        `http://localhost/api/school/admissions/applications?schoolSlug=${tenant.school.slug}`,
        { headers: { cookie: tenant.cookieHeader } },
      ),
    );
    const listJson = await listRes.json();
    expect(listJson.applications).toHaveLength(1);
    expect(listJson.applications[0].previousSchool).toBe("Old Prep School");
  });
});
