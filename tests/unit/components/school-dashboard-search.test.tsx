// @vitest-environment jsdom
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SchoolDashboard } from "@/modules/school/components/school-dashboard";
import type { SchoolDashboardData } from "@/modules/school/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("SchoolDashboard Ctrl+K search modal filtering", () => {
  afterEach(() => {
    cleanup();
  });

  const dashboardData: SchoolDashboardData = {
    school: {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Synthetic Demo Academy",
      slug: "synthetic-demo-academy",
      code: "SDA-101",
      affiliationBoard: "CBSE",
      city: "Jaipur",
      state: "Rajasthan",
    },
    currentUser: {
      name: "Synthetic Principal",
      role: "Principal",
      avatarInitials: "SP",
    },
    academicSession: {
      currentDate: "Thu, Nov 26, 2026",
      year: "2026 – 2027",
      term: "Term 2",
      workingDaysLeft: 100,
    },
    kpis: {
      totalStudents: { value: 2, change: 0 },
      totalStaff: { value: 1, change: 0 },
      pendingAdmissions: { value: 1, change: 0 },
      feeDues: { value: 0, change: 0 },
    },
    studentOverview: { total: 2, sections: [] },
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
    recentAdmissions: [
      {
        id: "app-1",
        name: "Aarav Verma",
        classApplied: "Class III",
        status: "Under Review",
        statusColor: "text-amber-700",
        statusBg: "bg-amber-50",
        appliedOn: "26 Nov 2026",
        initials: "AV",
        avatarBg: "bg-violet-100",
      },
      {
        id: "app-2",
        name: "Ananya Nair",
        classApplied: "Class V",
        status: "Approved",
        statusColor: "text-emerald-700",
        statusBg: "bg-emerald-50",
        appliedOn: "25 Nov 2026",
        initials: "AN",
        avatarBg: "bg-violet-100",
      },
    ],
    recentActivities: [],
    classStrength: [],
    academicPerformance: { overallPassRate: 0, trendVsLastTerm: 0, termTrends: [], topClasses: [] },
    admissionFunnel: {
      enquiries: 0,
      applications: 2,
      shortlisted: 1,
      admitted: 1,
      conversionRate: 50,
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
    genderBreakdown: {
      total: 0,
      boys: 0,
      boysPercentage: 0,
      girls: 0,
      girlsPercentage: 0,
    },
    keyInsights: [],
    notices: [],
    communicationSummary: { noticesSent: 0, smsDelivered: 0, emailsDelivered: 0 },
  };

  const user = {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Synthetic Principal",
    email: "principal@scholonix.example",
    phone: "+919000000001",
    role: "PRINCIPAL",
  };

  it("filters recent admissions and workspace navigation dynamically as the user types", async () => {
    const actor = userEvent.setup();
    render(<SchoolDashboard initialData={dashboardData} user={user} />);

    await actor.click(screen.getByRole("button", { name: /Search students, staff, classes, fees/i }));

    const dialog = screen.getByRole("dialog", { name: "Search school workspace" });
    const modal = within(dialog);
    const input = modal.getByLabelText("Search Student ID, name, classes, admissions, or pages");
    expect(modal.getByText("Aarav Verma")).toBeInTheDocument();
    expect(modal.getByText("Ananya Nair")).toBeInTheDocument();

    await actor.type(input, "Ananya");
    expect(modal.queryByText("Aarav Verma")).toBeNull();
    const ananyaLink = modal.getByRole("link", { name: /Ananya Nair/i });
    expect(ananyaLink.getAttribute("href")).toBe(
      "/synthetic-demo-academy/admissions?tab=applications&search=Ananya%20Nair",
    );

    await actor.click(modal.getByLabelText("Clear search"));
    expect(modal.getByText("Aarav Verma")).toBeInTheDocument();
  });
});
