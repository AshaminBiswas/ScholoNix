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
    expect(screen.getByText(/No admission applications found/i)).toBeTruthy();
    expect(screen.getByText(/No admission activity yet/i)).toBeTruthy();
    expect(screen.getByText(/All caught up/i)).toBeTruthy();
    expect(document.querySelector("#school-portal-help-btn")).toBeNull();

    // Switch to Enquiries tab
    await actor.click(screen.getByRole("tab", { name: "Enquiries" }));
    expect(screen.getByText(/No enquiries recorded yet/i)).toBeTruthy();

    // Switch to Admitted Students tab
    await actor.click(screen.getByRole("tab", { name: "Admitted Students" }));
    expect(screen.getByText(/No admitted students yet/i)).toBeTruthy();

    // Switch to Settings tab
    await actor.click(screen.getByRole("tab", { name: "Settings" }));
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
    expect(screen.getByRole("tab", { name: "Enquiries" }).getAttribute("aria-selected")).toBe("true");

    await actor.click(screen.getByRole("link", { name: "Admitted Students" }));
    expect(screen.getByText(/No admitted students yet/i)).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Admitted Students" }).getAttribute("aria-selected")).toBe("true");

    await actor.click(screen.getByRole("link", { name: "Admission Settings" }));
    expect(screen.getByRole("heading", { name: "Admission Settings" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Settings" }).getAttribute("aria-selected")).toBe("true");

    // Client-side instant switching must not issue slow network round-trips
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
