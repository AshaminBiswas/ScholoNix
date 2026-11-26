// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EnquiriesWorkspace } from "@/modules/school/admissions/components/enquiries/enquiries-workspace";
import type {
  AdmissionEnquiryFollowUpRecord,
  AdmissionEnquiryRecord,
  AdmissionEnquirySourceRecord,
  EnquiryDossierData,
} from "@/modules/school/admissions/types";

describe("EnquiriesWorkspace UI", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sampleSources: AdmissionEnquirySourceRecord[] = [
    {
      id: "src-1",
      schoolId: "sch-1",
      name: "Website",
      description: "School website form",
      isActive: true,
      colorToken: "violet",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "src-2",
      schoolId: "sch-1",
      name: "Walk-In",
      description: "Front desk walk-in",
      isActive: true,
      colorToken: "sky",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  const sampleEnquiries: AdmissionEnquiryRecord[] = [
    {
      id: "enq-1",
      schoolId: "sch-1",
      enquiryCode: "ENQ2026-0001",
      enquiryDate: "2026-01-20T00:00:00.000Z",
      studentName: "Aarav Synthetic",
      studentDob: "2018-04-15",
      studentGender: "Male",
      guardianName: "Rajesh Synthetic",
      guardianRelation: "Father",
      guardianPhone: "+919876543210",
      guardianEmail: "rajesh.synthetic@example.com",
      addressLine1: "100 Sample Road",
      addressLine2: null,
      city: "Jaipur",
      state: "Rajasthan",
      pinCode: "302001",
      gradeApplied: "Class III",
      academicYear: "2026-27",
      source: "Website",
      enquiryType: "Admission Enquiry",
      status: "FOLLOW_UP",
      assignedToUserId: null,
      assignedToName: "Rahul K.",
      nextFollowUpAt: "2026-01-25T05:00:00.000Z",
      hasSiblingsInSchool: false,
      interestedInTransport: true,
      interestedInHostel: false,
      requiresSpecialSupport: false,
      isDraft: false,
      notes: "Asking about fee structure and bus routes.",
      convertedApplicationId: null,
      createdAt: "2026-01-20T00:00:00.000Z",
      updatedAt: "2026-01-20T00:00:00.000Z",
    },
  ];

  const sampleFollowUps: AdmissionEnquiryFollowUpRecord[] = [
    {
      id: "fu-1",
      schoolId: "sch-1",
      enquiryId: "enq-1",
      enquiryCode: "ENQ2026-0001",
      studentName: "Aarav Synthetic",
      guardianName: "Rajesh Synthetic",
      academicYear: "2026-27",
      followUpType: "Phone Call",
      scheduledAt: "2099-01-25T05:00:00.000Z",
      completedAt: null,
      status: "UPCOMING",
      assignedToUserId: null,
      assignedToName: "Rahul K.",
      notes: "Call guardian to confirm visit.",
      outcome: null,
      createdByUserId: null,
      createdAt: "2026-01-20T00:00:00.000Z",
      updatedAt: "2026-01-20T00:00:00.000Z",
    },
  ];

  const sampleDossier: EnquiryDossierData = {
    enquiry: sampleEnquiries[0]!,
    followUps: sampleFollowUps,
    communications: [],
    notes: [
      {
        id: "note-1",
        schoolId: "sch-1",
        enquiryId: "enq-1",
        category: "Admission Related",
        title: "Initial Counselling Note",
        content: "Discussed fee structure with guardian.",
        createdByUserId: null,
        createdByName: "Rahul K.",
        createdAt: "2026-01-20T05:00:00.000Z",
        updatedAt: "2026-01-20T05:00:00.000Z",
      },
    ],
    activities: [
      {
        id: "act-1",
        schoolId: "sch-1",
        applicationId: null,
        enquiryId: "enq-1",
        actorId: null,
        actorName: "Rahul K.",
        action: "ENQUIRY_CREATED",
        summary: "Enquiry ENQ2026-0001 logged.",
        createdAt: "2026-01-20T05:00:00.000Z",
      },
    ],
    staffOptions: [],
  };

  it("navigates across Overview, Enquiry List, Follow-ups, Sources, Reports, Create Enquiry Form, and Enquiry Detail 5-tab workbench", async () => {
    const actor = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response(JSON.stringify({ success: true, dossier: sampleDossier }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const onRefreshOverview = vi.fn().mockResolvedValue(undefined);
    const onCreateEnquiry = vi.fn().mockResolvedValue(sampleEnquiries[0]);
    const onUpdateOrConvertEnquiry = vi.fn().mockResolvedValue(undefined);

    render(
      <EnquiriesWorkspace
        schoolName="Sunrise Synthetic School"
        schoolSlug="sunrise-synthetic"
        enquiries={sampleEnquiries}
        sources={sampleSources}
        followUps={sampleFollowUps}
        applications={[]}
        availableAcademicYears={["2026-27"]}
        availableGrades={["Nursery", "Class III"]}
        currentAcademicYear="2026-27"
        staffOptions={[]}
        canWrite
        canExport
        onRefreshOverview={onRefreshOverview}
        onCreateEnquiry={onCreateEnquiry}
        onUpdateOrConvertEnquiry={onUpdateOrConvertEnquiry}
      />,
    );

    // Overview renders KPIs + recent Enquiries table
    expect(screen.getByText("Total Enquiries")).toBeTruthy();
    expect(screen.getByText("ENQ2026-0001")).toBeTruthy();

    // Portal 3-dot action menu opens on document.body & closes on Escape
    await actor.click(screen.getByRole("button", { name: "More actions for ENQ2026-0001" }));
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Convert to Application" })).toBeTruthy();
    await actor.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();

    // Switch through top sub-tabs
    await actor.click(screen.getByRole("button", { name: "Enquiry List" }));
    expect(screen.getByRole("heading", { name: "Enquiry List" })).toBeTruthy();

    await actor.click(screen.getByRole("button", { name: "Follow-ups" }));
    expect(screen.getByRole("heading", { name: "Follow-ups" })).toBeTruthy();
    expect(screen.getAllByText(/ENQ2026-0001/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("heading", { name: "Schedule New Follow-up" })).toBeTruthy();

    await actor.click(screen.getByRole("button", { name: "Sources" }));
    expect(screen.getByRole("heading", { name: "Enquiry Sources" })).toBeTruthy();
    expect(screen.getByText("School website form")).toBeTruthy();

    await actor.click(screen.getByRole("button", { name: "Reports" }));
    expect(
      screen.getByRole("heading", { name: /Enquiry Reports & Conversion Funnel/i }),
    ).toBeTruthy();

    // Open Create Enquiry Full Form Page
    await actor.click(screen.getByRole("button", { name: "+ New Enquiry" }));
    expect(screen.getByRole("heading", { name: "Create Enquiry" })).toBeTruthy();
    await actor.click(screen.getByRole("button", { name: /Back to Enquiry List/i }));

    // Open Enquiry Details Workbench & switch all 5 tabs
    await actor.click(screen.getByRole("button", { name: "View details for ENQ2026-0001" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Enquiry Details" })).toBeTruthy();
    });

    await actor.click(screen.getByRole("button", { name: /Follow-ups \(1\)/i }));
    expect(screen.getByText("Follow-up History")).toBeTruthy();
    expect(screen.getByText("Call guardian to confirm visit.")).toBeTruthy();

    await actor.click(screen.getByRole("button", { name: /Communications \(0\)/i }));
    expect(screen.getByText("Communication Templates")).toBeTruthy();

    await actor.click(screen.getByRole("button", { name: /Notes \(1\)/i }));
    expect(screen.getByText(/Initial Counselling Note/i)).toBeTruthy();

    await actor.click(screen.getByRole("button", { name: "Activity Log" }));
    expect(screen.getByText("Enquiry ENQ2026-0001 logged.")).toBeTruthy();
  });
});
