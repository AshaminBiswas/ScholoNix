import { randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import {
  GET as enquiriesGet,
  POST as enquiriesPost,
} from "@/app/api/school/admissions/enquiries/route";
import {
  GET as enquiryDossierGet,
  PATCH as enquiryPatch,
} from "@/app/api/school/admissions/enquiries/[enquiryId]/route";
import {
  POST as followUpsPost,
  PATCH as followUpsPatch,
} from "@/app/api/school/admissions/enquiries/[enquiryId]/follow-ups/route";
import { GET as followUpsGlobalGet } from "@/app/api/school/admissions/enquiries/follow-ups/route";
import {
  GET as commsGet,
  POST as commsPost,
} from "@/app/api/school/admissions/enquiries/[enquiryId]/communications/route";
import {
  POST as notesPost,
  PATCH as notesPatch,
  DELETE as notesDelete,
} from "@/app/api/school/admissions/enquiries/[enquiryId]/notes/route";
import {
  GET as sourcesGet,
  POST as sourcesPost,
  PATCH as sourcesPatch,
  DELETE as sourcesDelete,
} from "@/app/api/school/admissions/enquiries/sources/route";
import { GET as enquiriesExportGet } from "@/app/api/school/admissions/enquiries/export/route";
import { authRepository } from "@/server/auth/auth-repository";
import { getSessionCookieName, sessionService } from "@/server/auth/session-service";
import { hashPassword } from "@/server/security/crypto";

async function seedSchoolAdmin(tag: string) {
  const unique = `${tag}-${Date.now()}-${randomBytes(3).toString("hex")}`.toLowerCase();
  const passwordHash = await hashPassword(`Enq!${randomBytes(8).toString("hex")}7`);
  const { school, user } = await authRepository.createUserWithSchool({
    school: {
      name: `Enquiry School ${tag} ${unique}`,
      slug: `sc_${randomBytes(10).toString("hex")}`,
      code: `EQ-${randomBytes(2).toString("hex").toUpperCase()}`,
      category: "Co-Educational School",
      affiliationBoard: "CBSE",
      city: "Pune",
      state: "Maharashtra",
      pinCode: "411001",
      country: "India",
    },
    user: {
      name: `Principal ${tag}`,
      email: `enquiries.${unique}@scholonix.example`,
      phone: `+9197${Math.floor(10000000 + Math.random() * 89999999)}`,
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

describe("Admissions Enquiries Workbench API", () => {
  it("supports full Enquiry lifecycle: create w/ follow-up, dossier, follow-ups, notes, comms w/ PDF attachment, sources CRUD, CSV export, conversion, and tenant isolation", async () => {
    const schoolA = await seedSchoolAdmin("alpha");
    const schoolB = await seedSchoolAdmin("beta");

    // 1. Seed & customize enquiry sources
    const srcRes = await sourcesGet(
      new NextRequest(
        `http://localhost/api/school/admissions/enquiries/sources?schoolSlug=${schoolA.school.slug}`,
        { headers: { cookie: schoolA.cookieHeader } },
      ),
    );
    expect(srcRes.status).toBe(200);
    const srcJson = await srcRes.json();
    expect(srcJson.sources.length).toBeGreaterThanOrEqual(5);

    const newSrcRes = await sourcesPost(
      new NextRequest(
        `http://localhost/api/school/admissions/enquiries/sources?schoolSlug=${schoolA.school.slug}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: schoolA.cookieHeader,
          },
          body: JSON.stringify({
            name: "Alumni Open House",
            description: "Campus open house referrals",
            isActive: true,
            colorToken: "indigo",
          }),
        },
      ),
    );
    expect(newSrcRes.status).toBe(201);
    const createdSource = (await newSrcRes.json()).source;

    const patchSrcRes = await sourcesPatch(
      new NextRequest(
        `http://localhost/api/school/admissions/enquiries/sources?schoolSlug=${schoolA.school.slug}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: schoolA.cookieHeader,
          },
          body: JSON.stringify({
            id: createdSource.id,
            description: "Updated campus open house referrals",
          }),
        },
      ),
    );
    expect(patchSrcRes.status).toBe(200);

    // 2. Create full enquiry with initial follow-up
    const tomorrowIso = new Date(Date.now() + 86_400_000).toISOString();
    const createEnqRes = await enquiriesPost(
      new NextRequest(
        `http://localhost/api/school/admissions/enquiries?schoolSlug=${schoolA.school.slug}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: schoolA.cookieHeader,
          },
          body: JSON.stringify({
            studentName: "Rohan Test Prospect",
            studentDob: "2018-05-12",
            studentGender: "Male",
            guardianName: "Suresh Test Guardian",
            guardianRelation: "Father",
            guardianPhone: "+919876543210",
            guardianEmail: "suresh.prospect@example.com",
            addressLine1: "42 Synthetic Avenue",
            city: "Pune",
            state: "Maharashtra",
            pinCode: "411001",
            gradeApplied: "Class I",
            academicYear: "2026-27",
            source: "Alumni Open House",
            enquiryType: "Campus Visit",
            interestedInTransport: true,
            notes: "Requested morning bus route details.",
            initialFollowUp: {
              followUpType: "Phone Call",
              scheduledAt: tomorrowIso,
              notes: "Confirm campus visit slot.",
            },
          }),
        },
      ),
    );
    expect(createEnqRes.status).toBe(201);
    const enquiry = (await createEnqRes.json()).enquiry;
    expect(enquiry.enquiryCode).toMatch(/^ENQ2026-/);
    expect(enquiry.status).toBe("FOLLOW_UP");
    expect(enquiry.interestedInTransport).toBe(true);

    // 3. Global Follow-ups & Update Follow-up status
    const globalFuRes = await followUpsGlobalGet(
      new NextRequest(
        `http://localhost/api/school/admissions/enquiries/follow-ups?schoolSlug=${schoolA.school.slug}`,
        { headers: { cookie: schoolA.cookieHeader } },
      ),
    );
    expect(globalFuRes.status).toBe(200);
    const followUpsList = (await globalFuRes.json()).followUps;
    expect(followUpsList.length).toBeGreaterThanOrEqual(1);
    const firstFu = followUpsList.find((f: { enquiryId: string }) => f.enquiryId === enquiry.id);
    expect(firstFu).toBeTruthy();

    const postFuRes = await followUpsPost(
      new NextRequest(
        `http://localhost/api/school/admissions/enquiries/${enquiry.id}/follow-ups?schoolSlug=${schoolA.school.slug}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: schoolA.cookieHeader,
          },
          body: JSON.stringify({
            followUpType: "Meeting",
            scheduledAt: tomorrowIso,
            notes: "Schedule principal interaction",
          }),
        },
      ),
      { params: Promise.resolve({ enquiryId: enquiry.id }) },
    );
    expect(postFuRes.status).toBe(201);

    const patchFuRes = await followUpsPatch(
      new NextRequest(
        `http://localhost/api/school/admissions/enquiries/${enquiry.id}/follow-ups?schoolSlug=${schoolA.school.slug}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: schoolA.cookieHeader,
          },
          body: JSON.stringify({
            followUpId: firstFu.id,
            status: "COMPLETED",
            outcome: "Parent confirmed visit for Friday",
          }),
        },
      ),
      { params: Promise.resolve({ enquiryId: enquiry.id }) },
    );
    expect(patchFuRes.status).toBe(200);
    expect((await patchFuRes.json()).followUp.status).toBe("COMPLETED");

    // 4. Send Communication with valid PDF attachment + download attachment
    const pdfBytes = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");
    const fd = new FormData();
    fd.append("channel", "Email");
    fd.append("recipient", "suresh.prospect@example.com");
    fd.append("subject", "School Brochure & Fee Structure");
    fd.append("message", "Please find attached our admissions brochure.");
    fd.append(
      "files",
      new File([pdfBytes], "brochure.pdf", { type: "application/pdf" }),
    );

    const commRes = await commsPost(
      new NextRequest(
        `http://localhost/api/school/admissions/enquiries/${enquiry.id}/communications?schoolSlug=${schoolA.school.slug}`,
        {
          method: "POST",
          headers: { cookie: schoolA.cookieHeader },
          body: fd,
        },
      ),
      { params: Promise.resolve({ enquiryId: enquiry.id }) },
    );
    expect(commRes.status).toBe(201);
    const commJson = await commRes.json();
    expect(commJson.communication.attachments).toHaveLength(1);
    const storageKey = commJson.communication.attachments[0].storageKey;

    const dlRes = await commsGet(
      new NextRequest(
        `http://localhost/api/school/admissions/enquiries/${enquiry.id}/communications?storageKey=${encodeURIComponent(
          storageKey,
        )}&schoolSlug=${schoolA.school.slug}`,
        { headers: { cookie: schoolA.cookieHeader } },
      ),
      { params: Promise.resolve({ enquiryId: enquiry.id }) },
    );
    expect(dlRes.status).toBe(200);

    // 5. Notes CRUD
    const noteCreateRes = await notesPost(
      new NextRequest(
        `http://localhost/api/school/admissions/enquiries/${enquiry.id}/notes?schoolSlug=${schoolA.school.slug}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: schoolA.cookieHeader,
          },
          body: JSON.stringify({
            category: "Parent Requirement",
            title: "Bus Stop Enquiry",
            content: "Parent requested transport route pickup near Sector 4.",
          }),
        },
      ),
      { params: Promise.resolve({ enquiryId: enquiry.id }) },
    );
    expect(noteCreateRes.status).toBe(201);
    const createdNote = (await noteCreateRes.json()).note;

    const notePatchRes = await notesPatch(
      new NextRequest(
        `http://localhost/api/school/admissions/enquiries/${enquiry.id}/notes?schoolSlug=${schoolA.school.slug}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: schoolA.cookieHeader,
          },
          body: JSON.stringify({
            noteId: createdNote.id,
            title: "Updated Bus Stop Requirement",
          }),
        },
      ),
      { params: Promise.resolve({ enquiryId: enquiry.id }) },
    );
    expect(notePatchRes.status).toBe(200);

    // 6. Dossier endpoint aggregates everything
    const dossierRes = await enquiryDossierGet(
      new NextRequest(
        `http://localhost/api/school/admissions/enquiries/${enquiry.id}?schoolSlug=${schoolA.school.slug}`,
        { headers: { cookie: schoolA.cookieHeader } },
      ),
      { params: Promise.resolve({ enquiryId: enquiry.id }) },
    );
    expect(dossierRes.status).toBe(200);
    const dossier = (await dossierRes.json()).dossier;
    expect(dossier.enquiry.id).toBe(enquiry.id);
    expect(dossier.followUps.length).toBe(2);
    expect(dossier.communications.length).toBe(1);
    expect(dossier.notes.length).toBe(1);
    expect(dossier.activities.length).toBeGreaterThanOrEqual(4);

    // 7. Cross-tenant isolation check (School B cannot read or mutate School A enquiry dossier)
    const crossDossier = await enquiryDossierGet(
      new NextRequest(
        `http://localhost/api/school/admissions/enquiries/${enquiry.id}?schoolSlug=${schoolB.school.slug}`,
        { headers: { cookie: schoolB.cookieHeader } },
      ),
      { params: Promise.resolve({ enquiryId: enquiry.id }) },
    );
    expect(crossDossier.status).toBe(404);

    const crossMismatchSlug = await enquiriesGet(
      new NextRequest(
        `http://localhost/api/school/admissions/enquiries?schoolSlug=${schoolA.school.slug}`,
        { headers: { cookie: schoolB.cookieHeader } },
      ),
    );
    expect(crossMismatchSlug.status).toBe(403);

    // 8. Export CSV
    const exportRes = await enquiriesExportGet(
      new NextRequest(
        `http://localhost/api/school/admissions/enquiries/export?schoolSlug=${schoolA.school.slug}&academicYear=2026-27`,
        { headers: { cookie: schoolA.cookieHeader } },
      ),
    );
    expect(exportRes.status).toBe(200);
    const csvText = await exportRes.text();
    expect(csvText).toContain("Rohan Test Prospect");

    // 9. Convert to Application (preserves DOB, Gender, Address)
    const convertRes = await enquiryPatch(
      new NextRequest(
        `http://localhost/api/school/admissions/enquiries/${enquiry.id}?schoolSlug=${schoolA.school.slug}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: schoolA.cookieHeader,
          },
          body: JSON.stringify({ action: "convert" }),
        },
      ),
      { params: Promise.resolve({ enquiryId: enquiry.id }) },
    );
    expect(convertRes.status).toBe(200);
    const converted = await convertRes.json();
    expect(converted.enquiry.status).toBe("CONVERTED");
    expect(converted.application.studentName).toBe("Rohan Test Prospect");
    expect(converted.application.dateOfBirth).toBe("2018-05-12");
    expect(converted.application.gender).toBe("Male");
    expect(converted.application.studentDetails?.address?.city).toBe("Pune");

    // 10. Delete Note & Source cleanup
    const delNoteRes = await notesDelete(
      new NextRequest(
        `http://localhost/api/school/admissions/enquiries/${enquiry.id}/notes?noteId=${createdNote.id}&schoolSlug=${schoolA.school.slug}`,
        { method: "DELETE", headers: { cookie: schoolA.cookieHeader } },
      ),
      { params: Promise.resolve({ enquiryId: enquiry.id }) },
    );
    expect(delNoteRes.status).toBe(200);

    const delSrcRes = await sourcesDelete(
      new NextRequest(
        `http://localhost/api/school/admissions/enquiries/sources?sourceId=${createdSource.id}&schoolSlug=${schoolA.school.slug}`,
        { method: "DELETE", headers: { cookie: schoolA.cookieHeader } },
      ),
    );
    expect(delSrcRes.status).toBe(200);
  });
});
