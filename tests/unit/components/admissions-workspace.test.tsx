// @vitest-environment jsdom
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdmissionsWorkspace } from "@/modules/school/admissions/components/admissions-workspace";
import { DEFAULT_ADMISSION_GRADES, type AdmissionsOverviewData } from "@/modules/school/admissions/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("AdmissionsWorkspace zero-state and interactive tabs", () => {
  afterEach(() => {
    cleanup();
  });

  const school = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Synthetic Horizon School",
    slug: "synthetic-horizon-school",
    code: "SHS-1",
    affiliationBoard: "CBSE",
  };
  const user = {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Synthetic Admin",
    displayRole: "Principal",
    avatarInitials: "SA",
    email: "admin@scholonix.example",
    phone: "+919000000001",
  };

  const emptyOverview: AdmissionsOverviewData = {
    schoolId: school.id,
    filters: {
      academicYear: "2026 – 2027",
      grade: "all",
      status: "all",
      verificationStatus: "all",
      datePreset: "all",
      from: "",
      to: "",
      granularity: "month",
      search: "",
      page: 1,
      pageSize: 10,
    },
    availableAcademicYears: ["2026 – 2027"],
    availableGrades: [...DEFAULT_ADMISSION_GRADES],
    settings: {
      schoolId: school.id,
      currentAcademicYear: "2026 – 2027",
      applicationDeadline: null,
      applicationPrefix: "APP",
      enabledGrades: [...DEFAULT_ADMISSION_GRADES],
      updatedAt: "2026-04-01T00:00:00.000Z",
    },
    kpis: {
      totalApplications: { value: 0, previousValue: 0, deltaPercent: null },
      shortlisted: { value: 0, previousValue: 0, deltaPercent: null },
      admitted: { value: 0, previousValue: 0, deltaPercent: null },
      conversionRate: { rate: 0, previousRate: 0, deltaPercentagePoints: null },
    },
    funnel: {
      enquiries: 0,
      applications: 0,
      shortlistedPipeline: 0,
      admitted: 0,
      conversionRate: 0,
      deltaPercentagePoints: null,
    },
    trend: [],
    byGrade: [],
    statusBreakdown: [
      { status: "UNDER_REVIEW", label: "Under Review", count: 0, percentage: 0, color: "#8B5CF6" },
      {
        status: "DOCUMENTS_PENDING",
        label: "Documents Pending",
        count: 0,
        percentage: 0,
        color: "#F59E0B",
      },
      { status: "SHORTLISTED", label: "Shortlisted", count: 0, percentage: 0, color: "#38BDF8" },
      { status: "ADMITTED", label: "Admitted", count: 0, percentage: 0, color: "#22C55E" },
      { status: "REJECTED", label: "Rejected", count: 0, percentage: 0, color: "#F472B6" },
    ],
    applications: [],
    pagination: { total: 0, page: 1, pageSize: 10, totalPages: 1 },
    enquiries: [],
    admittedStudents: [],
    activities: [],
    reminders: [],
    permissions: { canWrite: true, canVerify: true, canExport: true, canManageSettings: true },
  };

  it("renders real empty states without hardcoded dummy records and switches tabs cleanly", async () => {
    const actor = userEvent.setup();
    render(
      <AdmissionsWorkspace
        school={school}
        user={user}
        initialData={emptyOverview}
        initialTab="overview"
      />,
    );

    expect(screen.getByRole("heading", { name: "Admissions", level: 1 })).toBeTruthy();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Breadcrumb" })).toBeNull();
    expect(screen.getByText(/No admission applications found/i)).toBeTruthy();
    expect(screen.getByText(/No admission activity yet/i)).toBeTruthy();
    expect(screen.getByText(/All caught up/i)).toBeTruthy();
    expect(document.querySelector("#school-portal-help-btn")).toBeNull();

    // Switch via sidebar Admissions dropdown links
    await actor.click(screen.getByRole("link", { name: "Enquiries" }));
    expect(screen.getByText(/No enquiries recorded yet/i)).toBeTruthy();

    await actor.click(screen.getByRole("link", { name: "Admitted Students" }));
    expect(screen.getByText(/No admitted students yet/i)).toBeTruthy();

    await actor.click(screen.getByRole("link", { name: "Admission Settings" }));
    expect(screen.getByRole("heading", { name: "Admission Settings" })).toBeTruthy();
  });

  it("opens New Application modal cleanly when triggered", async () => {
    const actor = userEvent.setup();
    render(
      <AdmissionsWorkspace
        school={school}
        user={user}
        initialData={emptyOverview}
        initialTab="overview"
      />,
    );

    const newAppBtn = document.querySelector("#admissions-new-application-btn") as HTMLButtonElement;
    expect(newAppBtn).not.toBeNull();
    await actor.click(newAppBtn);

    expect(screen.getByText("New Admission Application")).toBeTruthy();
    expect(screen.getByLabelText(/Student Name/i)).toBeTruthy();
  });

  it("switches tabs instantaneously via left sidebar Admissions dropdown links without refetching", async () => {
    const actor = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(
      <AdmissionsWorkspace
        school={school}
        user={user}
        initialData={emptyOverview}
        initialTab="overview"
      />,
    );

    // Submenu is open automatically while on admissions routes
    await actor.click(screen.getByRole("link", { name: "Enquiries" }));
    expect(screen.getByText(/No enquiries recorded yet/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Enquiries" }).getAttribute("aria-current")).toBe("page");

    await actor.click(screen.getByRole("link", { name: "Admitted Students" }));
    expect(screen.getByText(/No admitted students yet/i)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Admitted Students" }).getAttribute("aria-current"),
    ).toBe("page");

    await actor.click(screen.getByRole("link", { name: "Admission Settings" }));
    expect(screen.getByRole("heading", { name: "Admission Settings" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Admission Settings" }).getAttribute("aria-current"),
    ).toBe("page");

    // Client-side instant switching must not issue slow network round-trips
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("never renders Syncing indicator and serves cached filter queries without redundant API fetches", async () => {
    const actor = userEvent.setup();
    const filteredResponse: AdmissionsOverviewData = {
      ...emptyOverview,
      filters: {
        ...emptyOverview.filters,
        academicYear: "all",
        status: "SHORTLISTED",
      },
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: filteredResponse }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    render(
      <AdmissionsWorkspace
        school={school}
        user={user}
        initialData={emptyOverview}
        initialTab="overview"
      />,
    );

    // Selecting Custom Range before picking dates from default "all" should not trigger a fetch or Syncing text
    await actor.selectOptions(screen.getByLabelText("Filter by date range"), "custom");
    expect(screen.queryByText(/Syncing/i)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();

    // Return Date Range to "all" (matches initial filter state -> still 0 fetches)
    await actor.selectOptions(screen.getByLabelText("Filter by date range"), "all");
    expect(fetchSpy).not.toHaveBeenCalled();

    // Change Academic Year to "all" (cold client cache -> 1 fetch) and then Status to "SHORTLISTED" (1 fetch)
    await actor.selectOptions(screen.getByLabelText("Filter by academic year"), "all");
    await actor.selectOptions(screen.getByLabelText("Filter by status"), "SHORTLISTED");
    expect(screen.queryByText(/Syncing/i)).toBeNull();
    const callsAfterWarmup = fetchSpy.mock.calls.length;
    expect(callsAfterWarmup).toBe(2);

    // Switch back to already-cached Academic Year="all", Status="all" -> hits client cache (0 new fetches)
    await actor.selectOptions(screen.getByLabelText("Filter by status"), "all");
    // Switch back to initial seeded combination -> hits client cache (0 new fetches)
    await actor.selectOptions(screen.getByLabelText("Filter by academic year"), "2026 – 2027");
    expect(screen.queryByText(/Syncing/i)).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(callsAfterWarmup);

    fetchSpy.mockRestore();
  });

  it("renders Application Management view with 5 KPI cards, workflow pills, view toggle, analytics, and import modal", async () => {
    const actor = userEvent.setup();
    const populatedOverview: AdmissionsOverviewData = {
      ...emptyOverview,
      kpis: {
        totalApplications: { value: 2, previousValue: 1, deltaPercent: 100 },
        shortlisted: { value: 1, previousValue: 0, deltaPercent: null },
        admitted: { value: 0, previousValue: 0, deltaPercent: null },
        conversionRate: { rate: 0, previousRate: 0, deltaPercentagePoints: null },
      },
      byGrade: [{ grade: "Class I", shortLabel: "I", count: 2 }],
      statusBreakdown: [
        { status: "UNDER_REVIEW", label: "Under Review", count: 1, percentage: 50, color: "#8B5CF6" },
        { status: "DOCUMENTS_PENDING", label: "Documents Pending", count: 0, percentage: 0, color: "#F59E0B" },
        { status: "SHORTLISTED", label: "Shortlisted", count: 1, percentage: 50, color: "#38BDF8" },
        { status: "ADMITTED", label: "Admitted", count: 0, percentage: 0, color: "#22C55E" },
        { status: "REJECTED", label: "Rejected", count: 0, percentage: 0, color: "#F472B6" },
      ],
      applications: [
        {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          schoolId: school.id,
          applicationCode: "APP2026-0001",
          admissionNumber: null,
          enquiryId: null,
          studentName: "Synthetic Aarav",
          gender: "Male",
          dateOfBirth: "2019-04-10",
          gradeApplied: "Class I",
          academicYear: "2026 – 2027",
          guardianName: "Synthetic Guardian",
          guardianRelation: "Parent",
          guardianPhone: "+919000000001",
          guardianEmail: "guardian@scholonix.example",
          previousSchool: null,
          status: "UNDER_REVIEW",
          verificationStatus: "PENDING",
          verificationNotes: null,
          documentsChecklist: [],
          appliedAt: "2026-04-01T10:00:00.000Z",
          shortlistedAt: null,
          admittedAt: null,
          rejectedAt: null,
          verifiedAt: null,
          createdAt: "2026-04-01T10:00:00.000Z",
          updatedAt: "2026-04-01T10:00:00.000Z",
        },
      ],
      pagination: { total: 2, page: 1, pageSize: 10, totalPages: 1 },
    };

    render(
      <AdmissionsWorkspace
        school={school}
        user={user}
        initialData={populatedOverview}
        initialTab="applications"
      />,
    );

    expect(screen.getByRole("heading", { name: "Application Management", level: 1 })).toBeTruthy();
    expect(document.querySelector("#admissions-import-applications-btn")).not.toBeNull();
    expect(screen.getAllByRole("button", { name: "Import Applications" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Download" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Document Verification" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Shortlisting" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Admission Approvals" })).toBeTruthy();

    expect(screen.getByRole("heading", { name: "Filter Applications" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Application Progress" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Grade-wise Applications" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Recently Added Applications" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Quick Actions" })).toBeTruthy();

    expect(screen.getByText("APP2026-0001")).toBeTruthy();
    expect(screen.getByLabelText("Inspect Synthetic Aarav")).toBeTruthy();
    expect(screen.getByLabelText("Edit Synthetic Aarav")).toBeTruthy();

    // Toggle Card grid view and back to Table list view
    await actor.click(screen.getByRole("button", { name: "Card grid view" }));
    expect(screen.getAllByText("Synthetic Aarav").length).toBeGreaterThanOrEqual(1);
    await actor.click(screen.getByRole("button", { name: "Table list view" }));
    expect(screen.getByRole("table")).toBeTruthy();

    // Open Import Applications dialog via header button
    await actor.click(document.querySelector("#admissions-import-applications-btn") as HTMLButtonElement);
    expect(screen.getByText(/Import Applications \(CSV\)/i)).toBeTruthy();
    await actor.click(screen.getByRole("button", { name: "Close import modal" }));

    // Switch inline workflow to Application Form and back
    const appFormButtons = screen.getAllByRole("button", { name: "Application Form" });
    await actor.click(appFormButtons[0]!);
    expect(screen.getByRole("heading", { name: "Student Application Form" })).toBeTruthy();
    await actor.click(screen.getByRole("button", { name: "Back to Applications" }));
    expect(screen.getByText("Filter Applications")).toBeTruthy();
  });
});
