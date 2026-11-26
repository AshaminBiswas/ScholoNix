// @vitest-environment jsdom
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApplicationFormWizard } from "@/modules/school/admissions/components/application-form/application-form-wizard";
import type { AdmissionApplicationRecord } from "@/modules/school/admissions/types";

describe("ApplicationFormWizard 4-step workflow", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const makeMockApp = (overrides?: Partial<AdmissionApplicationRecord>): AdmissionApplicationRecord => ({
    id: "11111111-1111-4111-8111-111111111111",
    schoolId: "22222222-2222-4222-8222-222222222222",
    applicationCode: "APP2026-0001",
    admissionNumber: null,
    enquiryId: null,
    studentName: "Synthetic Aarav",
    gender: "Male",
    dateOfBirth: "2017-03-12",
    gradeApplied: "Class III",
    academicYear: "2026 – 2027",
    guardianName: "Synthetic Rajesh",
    guardianRelation: "Father",
    guardianPhone: "+919876543210",
    guardianEmail: "rajesh@scholonix.example",
    previousSchool: null,
    status: "UNDER_REVIEW",
    verificationStatus: "PENDING",
    verificationNotes: null,
    documentsChecklist: [],
    admissionType: "FRESH",
    isDraft: false,
    currentStep: 4,
    appliedAt: "2026-04-01T10:00:00.000Z",
    shortlistedAt: null,
    admittedAt: null,
    rejectedAt: null,
    verifiedAt: null,
    createdAt: "2026-04-01T10:00:00.000Z",
    updatedAt: "2026-04-01T10:00:00.000Z",
    ...overrides,
  });

  it("walks through Steps 1 -> 2 -> 3 (Fresh & Transfer marks/history) -> 4 (Review & Submit) and saves draft", async () => {
    const actor = userEvent.setup();
    const onCreateApplication = vi.fn(async (payload) =>
      makeMockApp({ isDraft: Boolean(payload.isDraft), studentName: payload.studentName }),
    );
    const onUpdateApplication = vi.fn(async (_id, payload) =>
      makeMockApp({ isDraft: Boolean(payload.isDraft) }),
    );
    const onViewApplications = vi.fn();

    // Mock document upload endpoint
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      const fd = init?.body as FormData | undefined;
      const docType = String(fd?.get("docType") || "birth_certificate");
      const file = fd?.get("file") as File | null;
      return new Response(
        JSON.stringify({
          success: true,
          document: {
            key: `key-${docType}`,
            docType,
            label: String(fd?.get("label") || docType),
            fileName: file?.name || `${docType}.pdf`,
            mimeType: file?.type || "application/pdf",
            sizeBytes: 120_000,
            storageKey: `22222222-2222-4222-8222-222222222222/admissions/${docType}.pdf`,
            uploadedAt: "2026-04-01T10:00:00.000Z",
          },
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      );
    });

    render(
      <ApplicationFormWizard
        schoolName="Sunrise International School"
        schoolSlug="sc_testtoken"
        availableGrades={["Class III", "Class IV"]}
        availableAcademicYears={["2026 – 2027", "2025 – 2026"]}
        defaultAcademicYear="2026 – 2027"
        drafts={[]}
        canWrite={true}
        onViewApplications={onViewApplications}
        onCreateApplication={onCreateApplication}
        onUpdateApplication={onUpdateApplication}
      />,
    );

    // Step 1: 25%
    expect(screen.getByText("25%")).toBeTruthy();
    expect(screen.getByText("Complete 1 of 4 steps")).toBeTruthy();

    // Validation blocks advancing when empty
    await actor.click(screen.getByRole("button", { name: /Next: Parent\/Guardian Info/i }));
    expect(screen.getByRole("alert").textContent).toMatch(/student's full name/i);

    await actor.type(screen.getByLabelText(/Full Name/i), "Aarav Sharma");
    await actor.type(screen.getByLabelText(/Date of Birth/i), "2017-03-12");
    await actor.selectOptions(screen.getByLabelText(/Gender/i), "Male");
    await actor.selectOptions(screen.getByLabelText(/Grade Applying For/i), "Class III");
    await actor.type(screen.getByLabelText(/Address Line 1/i), "House No. 45, Green Park");
    await actor.type(screen.getByLabelText(/City/i), "Gurgaon");
    await actor.selectOptions(screen.getByLabelText(/State/i), "Haryana");
    await actor.type(screen.getByLabelText(/Postal Code/i), "122001");

    await actor.click(screen.getByRole("button", { name: /Next: Parent\/Guardian Info/i }));

    // Step 2: 50%
    expect(screen.getByText("50%")).toBeTruthy();
    await actor.type(screen.getByLabelText(/Full Name \*/i), "Rajesh Sharma");
    await actor.type(document.querySelector("#wiz-g1-email") as HTMLInputElement, "rajesh@scholonix.example");
    await actor.type(document.querySelector("#wiz-g1-phone") as HTMLInputElement, "+919876543210");
    await actor.click(screen.getByLabelText(/Same as student address/i));
    expect((document.querySelector("#wiz-g-city") as HTMLInputElement).value).toBe("Gurgaon");
    await actor.type(screen.getByLabelText(/Emergency Contact Number/i), "+919876543211");

    // Save draft on Step 2
    await actor.click(screen.getByRole("button", { name: /Save as Draft/i }));
    expect(onCreateApplication).toHaveBeenCalledWith(expect.objectContaining({ isDraft: true }));

    await actor.click(screen.getByRole("button", { name: /Next: Academic Details/i }));

    // Step 3: 75% (Fresh default -> Transfer switch)
    expect(screen.getByText("75%")).toBeTruthy();
    expect(screen.getByText(/Academic details \(previous school, marks, etc\.\) are not required for Fresh Admission/i)).toBeTruthy();

    await actor.click(screen.getByRole("radio", { name: /Admission \(Transfer\)/i }));
    await actor.type(screen.getByLabelText(/Previous School Name/i), "Oakridge Prep");
    await actor.selectOptions(screen.getByLabelText(/Board \/ Curriculum/i), "CBSE");
    await actor.selectOptions(screen.getByLabelText(/Last Standard Studied/i), "Class III");
    await actor.selectOptions(screen.getByLabelText(/Year of Completion/i), String(new Date().getFullYear()));
    await actor.type(screen.getByLabelText(/Total Marks/i), "500");
    await actor.type(screen.getByLabelText(/Marks Obtained/i), "385");
    expect((document.querySelector("#wiz-percentage") as HTMLInputElement).value).toBe("77.0%");

    // Add repeatable previous year row
    await actor.click(screen.getByRole("button", { name: /Add Previous Year/i }));
    expect(screen.getByLabelText("Previous academic year")).toBeTruthy();

    // Upload required Transfer docs
    const samplePdf = new File(["%PDF-1.4 sample"], "doc.pdf", { type: "application/pdf" });
    await actor.upload(screen.getByLabelText(/Upload Student's Aadhaar Card/i), samplePdf);
    await actor.upload(screen.getByLabelText(/Upload Last Passing Marksheet/i), samplePdf);
    await actor.upload(screen.getByLabelText(/Upload Birth Certificate/i), samplePdf);
    await actor.upload(screen.getByLabelText(/Upload Father's Aadhaar Card/i), samplePdf);

    await actor.click(screen.getByRole("button", { name: /Next: Review & Submit/i }));

    // Step 4: 100%
    expect(screen.getByText("100%")).toBeTruthy();
    expect(screen.getByText("Review & Submit Application")).toBeTruthy();
    expect(screen.getByText(/Uploaded Documents \(4\)/i)).toBeTruthy();

    // Declaration required before submit
    await actor.click(screen.getByRole("button", { name: /Submit Application/i }));
    expect(screen.getByRole("alert").textContent).toMatch(/declaration/i);

    await actor.click(document.querySelector("#wiz-declaration-checkbox") as HTMLInputElement);
    await actor.click(screen.getByRole("button", { name: /Submit Application/i }));

    expect(onUpdateApplication).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
      expect.objectContaining({
        isDraft: false,
        admissionType: "TRANSFER",
        declarationAccepted: true,
      }),
    );
    expect(onViewApplications).toHaveBeenCalled();
  });
});
