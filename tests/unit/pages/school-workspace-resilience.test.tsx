// @vitest-environment jsdom
import * as React from "react";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ServiceUnavailableError } from "@/lib/errors";

const mockResolveTenantRouteAccess = vi.fn();
const mockGetDashboardDataFromSession = vi.fn();
const mockGetSafeFallbackDashboardData = vi.fn();

vi.mock("@/server/school/resolve-tenant-route", () => ({
  resolveTenantRouteAccess: (...args: unknown[]) => mockResolveTenantRouteAccess(...args),
}));

vi.mock("@/server/school/school-dashboard-service", () => ({
  schoolDashboardService: {
    getDashboardDataFromSession: (...args: unknown[]) => mockGetDashboardDataFromSession(...args),
    getSafeFallbackDashboardData: (...args: unknown[]) => mockGetSafeFallbackDashboardData(...args),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("SchoolWorkspacePage Server Component resilience", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockResolveTenantRouteAccess.mockReset();
    mockGetDashboardDataFromSession.mockReset();
    mockGetSafeFallbackDashboardData.mockReset();
  });

  it("renders TenantServiceUnavailableView without throwing when session lookup fails", async () => {
    mockResolveTenantRouteAccess.mockResolvedValue({
      authorized: false,
      reason: "SERVICE_UNAVAILABLE",
      message: "Authentication database is temporarily unavailable. Please try again in a moment.",
    });

    const { default: SchoolWorkspacePage } = await import("@/app/(school)/[schoolSlug]/page");
    const jsx = await SchoolWorkspacePage({
      params: Promise.resolve({ schoolSlug: "synthetic-school" }),
    });

    render(jsx as React.ReactElement);
    expect(screen.getByRole("heading", { name: /Workspace Temporarily Unavailable/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Try Again/i })).toBeTruthy();
  });

  it("degrades cleanly to fallback dashboard data when dashboard service throws unexpectedly", async () => {
    const fakeSchool = {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Synthetic Resilience Academy",
      slug: "synthetic-resilience-academy",
      code: "SRA-01",
      affiliationBoard: "CBSE",
      city: "Jaipur",
      state: "Rajasthan",
    };
    const fakeUser = {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Test Principal",
      email: "principal@example.test",
      phone: "+910000000000",
      role: "PRINCIPAL",
    };

    mockResolveTenantRouteAccess.mockResolvedValue({
      authorized: true,
      session: { sessionId: "sess-1", user: fakeUser, school: fakeSchool },
      school: fakeSchool,
    });
    mockGetDashboardDataFromSession.mockRejectedValue(
      new ServiceUnavailableError("Redis/DB transient interruption"),
    );
    mockGetSafeFallbackDashboardData.mockReturnValue({
      school: fakeSchool,
      currentUser: { name: fakeUser.name, role: "Principal", avatarInitials: "TP" },
      academicSession: {
        currentDate: "Wed, Nov 25, 2026",
        year: "2026 – 2027",
        term: "Term 2",
        workingDaysLeft: 120,
      },
      kpis: {
        totalStudents: { value: 0, change: 0 },
        totalStaff: { value: 0, change: 0 },
        pendingAdmissions: { value: 0, change: 0 },
        feeDues: { value: 0, change: 0 },
      },
      studentOverview: { total: 0, sections: [] },
      attendanceToday: { rate: 0, present: 0, absent: 0, notMarked: 0 },
      todayTasks: [],
      feeCollection: {
        collectedAmount: 0,
        collectionRate: 0,
        totalFee: 0,
        pendingFee: 0,
        overdueFee: 0,
        monthlyTrends: [],
      },
      upcomingEvents: [],
      recentAdmissions: [],
      recentActivities: [],
      classStrength: [],
      academicPerformance: { overallPassRate: 0, trendVsLastTerm: 0, termTrends: [], topClasses: [] },
      admissionFunnel: {
        enquiries: 0,
        applications: 0,
        shortlisted: 0,
        admitted: 0,
        conversionRate: 0,
        trendVsLastYear: 0,
      },
      staffOverview: {
        total: 0,
        teaching: 0,
        teachingPercentage: 0,
        nonTeaching: 0,
        nonTeachingPercentage: 0,
        administrative: 0,
        adminPercentage: 0,
      },
      genderBreakdown: { total: 0, boys: 0, boysPercentage: 0, girls: 0, girlsPercentage: 0 },
      keyInsights: [],
      notices: [],
      communicationSummary: { noticesSent: 0, smsDelivered: 0, emailsDelivered: 0 },
    });

    const { default: SchoolWorkspacePage } = await import("@/app/(school)/[schoolSlug]/page");
    const jsx = await SchoolWorkspacePage({
      params: Promise.resolve({ schoolSlug: fakeSchool.slug }),
    });

    render(jsx as React.ReactElement);
    expect(mockGetSafeFallbackDashboardData).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText(/Synthetic Resilience Academy/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /Good Morning, Test Principal/i })).toBeTruthy();
  });
});
