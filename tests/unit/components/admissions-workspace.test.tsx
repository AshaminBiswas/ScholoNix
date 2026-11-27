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
    expect(screen.getByRole("heading", { name: "Admission Settings", level: 1 })).toBeTruthy();
    expect(
      screen.queryByText(
        "Manage enquiries, applications, document verification, and student admissions in one place.",
      ),
    ).toBeNull();
    expect(document.querySelector("#admissions-download-report-btn")).toBeNull();
    expect(screen.queryByRole("button", { name: "Download Report" })).toBeNull();
    // Preserved core controls alongside new customizable sections
    expect(screen.getByLabelText(/Current Academic Year/i)).toBeTruthy();
    expect(screen.getByLabelText(/Application ID Prefix/i)).toBeTruthy();
    expect(screen.getByText(/Grades Open for Admission/i)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Seat & Quota Settings" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Document Requirements" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Admission Approval Workflow" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Additional Settings" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Classwise Fee Structure" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Classwise Subject Structure" })).toBeTruthy();

    // Custom class creation + customizable classwise fees & subjects
    await actor.type(screen.getByLabelText("Custom class name"), "Playgroup");
    await actor.click(screen.getByRole("button", { name: "Add Class" }));
    expect(screen.getAllByText("Playgroup").length).toBeGreaterThanOrEqual(1);

    await actor.click(screen.getByRole("button", { name: /Load Starter Fee Plan/i }));
    expect(screen.getByDisplayValue("Admission Fee")).toBeTruthy();
    expect(screen.getByDisplayValue("Tuition Fee")).toBeTruthy();
    await actor.click(screen.getByRole("button", { name: /Add Fee Head/i }));
    expect(screen.getByDisplayValue("Custom Fee Head")).toBeTruthy();

    await actor.click(screen.getByRole("button", { name: /Load Starter Subjects/i }));
    await actor.click(screen.getByRole("button", { name: /Add Subject/i }));
    expect(screen.getByDisplayValue("New Subject")).toBeTruthy();
  });

  it("does not render New Application button on Admissions Overview", () => {
    render(
      <AdmissionsWorkspace
        school={school}
        user={user}
        initialData={emptyOverview}
        initialTab="overview"
      />,
    );

    expect(document.querySelector("#admissions-new-application-btn")).toBeNull();
    expect(screen.queryByRole("button", { name: "New Application" })).toBeNull();
  });

  it("switches tabs instantaneously via left sidebar Admissions dropdown links without refetching", async () => {
    const actor = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    window.history.replaceState({ __NA: true, tree: ["root"] }, "", "/synthetic-horizon-school/admissions?tab=overview");

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
    expect(window.history.state).toEqual({ __NA: true, tree: ["root"] });

    await actor.click(screen.getByRole("link", { name: "Admitted Students" }));
    expect(screen.getByText(/No admitted students yet/i)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Admitted Students" }).getAttribute("aria-current"),
    ).toBe("page");

    await actor.click(screen.getByRole("link", { name: "Admission Settings" }));
    expect(screen.getByRole("heading", { name: "Admission Settings", level: 1 })).toBeTruthy();
    expect(
      screen.queryByText(
        "Manage enquiries, applications, document verification, and student admissions in one place.",
      ),
    ).toBeNull();
    expect(document.querySelector("#admissions-download-report-btn")).toBeNull();
    expect(screen.queryByRole("button", { name: "Download Report" })).toBeNull();
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

  it("renders Application Management view with 5 KPI cards, horizontally scrollable workflow pills, view toggle, and analytics without Import Applications buttons", async () => {
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
    expect(document.querySelector("#admissions-import-applications-btn")).toBeNull();
    expect(screen.queryByRole("button", { name: "Import Applications" })).toBeNull();
    expect(document.querySelector("#admissions-new-application-btn")).toBeNull();
    expect(screen.queryByRole("button", { name: "New Application" })).toBeNull();
    expect(screen.getByRole("button", { name: "Download" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Document Verification" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Shortlisting" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Admission Approvals" })).toBeTruthy();

    const workflowGroup = screen.getByRole("group", { name: "Application management workflows" });
    expect(workflowGroup.className).toContain("overflow-x-auto");
    expect(workflowGroup.className).toContain("flex-nowrap");
    expect(workflowGroup.className).toContain("no-scrollbar");

    expect(screen.getByRole("heading", { name: "Filter Applications" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Application Progress" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Grade-wise Applications" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Recently Added Applications" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Quick Actions" })).toBeTruthy();

    expect(screen.getByText("APP2026-0001")).toBeTruthy();
    expect(screen.getByLabelText("Inspect Synthetic Aarav")).toBeTruthy();
    expect(screen.getByLabelText("Edit Synthetic Aarav")).toBeTruthy();

    // Open three-dot action menu -> must portal cleanly outside table region div
    const tableRegion = screen.getByRole("region", { name: /All Applications/i });
    const moreActionsBtn = screen.getByLabelText("More actions for Synthetic Aarav");
    await actor.click(moreActionsBtn);
    const portalMenu = screen.getByRole("menu", { name: "Actions for Synthetic Aarav" });
    expect(portalMenu).toBeTruthy();
    expect(tableRegion.contains(portalMenu)).toBe(false);
    expect(portalMenu.style.position).toBe("fixed");
    expect(screen.getByRole("menuitem", { name: /Download A4 PDF/i })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Shortlist Applicant/i })).toBeTruthy();

    // Pressing Escape dismisses the floating menu cleanly
    await actor.keyboard("{Escape}");
    expect(screen.queryByRole("menu", { name: "Actions for Synthetic Aarav" })).toBeNull();

    // Toggle Card grid view (also has three-dot menu) and back to Table list view
    await actor.click(screen.getByRole("button", { name: "Card grid view" }));
    expect(screen.getAllByText("Synthetic Aarav").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText("More actions for Synthetic Aarav")).toBeTruthy();
    await actor.click(screen.getByRole("button", { name: "Table list view" }));
    expect(screen.getByRole("table")).toBeTruthy();

    // Switch inline workflow to 4-step Application Form wizard and back
    const appFormButtons = screen.getAllByRole("button", { name: "Application Form" });
    await actor.click(appFormButtons[0]!);
    expect(screen.getByRole("heading", { name: "Application Form", level: 2 })).toBeTruthy();
    expect(screen.getByText("25%")).toBeTruthy();
    await actor.click(screen.getByRole("button", { name: /View Applications/i }));
    expect(screen.getByText("Filter Applications")).toBeTruthy();

    // Clicking Inspect shows all admission details & only uploaded documents (no checklist rows)
    await actor.click(screen.getByLabelText("Inspect Synthetic Aarav"));
    expect(screen.getByText(/1\. Student Details & Residential Address/i)).toBeTruthy();
    expect(screen.getByText(/2\. Parent \/ Guardian Information/i)).toBeTruthy();
    expect(screen.getByText(/3\. Academic Details/i)).toBeTruthy();
    expect(screen.getByText(/Uploaded Documents \(0\)/i)).toBeTruthy();
    expect(screen.queryByText("Document Checklist")).toBeNull();
    await actor.click(screen.getByLabelText("Close application details"));

    // Clicking Edit opens the full 4-step admission form pre-filled with Synthetic Aarav
    await actor.click(screen.getByLabelText("Edit Synthetic Aarav"));
    expect(screen.getByRole("heading", { name: /Edit Application \(APP2026-0001\)/i, level: 2 })).toBeTruthy();
    expect((screen.getByLabelText(/Full Name/i) as HTMLInputElement).value).toBe("Synthetic Aarav");
  });
});
