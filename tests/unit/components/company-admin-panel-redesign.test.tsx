// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));

import { ThemeProvider } from "@/components/theme/theme-provider";
import { CompanyAdminPanel } from "@/modules/platform/components/company-admin-panel";
import {
  buildPlatformRouteUrl,
  parsePlatformSubSegments,
} from "@/modules/platform/routing";
import type { PlatformOverviewData, PlatformSchoolEntry } from "@/modules/platform/types";

const mockOverview: PlatformOverviewData = {
  periodDays: 30,
  kpis: {
    totalSchools: 2,
    activeSchools: 1,
    trialSchools: 1,
    suspendedSchools: 0,
    totalUsers: 45,
    totalApplications: 18,
    totalEnquiries: 10,
    totalAdmittedStudents: 120,
    studentFeeCollectedPaise: 5000000,
    saasRevenueCollectedPaise: 399900,
    saasPendingPaise: 199900,
    openSupportTickets: 1,
    mrrPaise: 599800,
    feeVolumePeriodPaise: 5000000,
    trialsExpiringNext7Days: 1,
    schoolsDelta: 1,
    schoolsGrowthPct: 100,
    activeSchoolsDelta: 1,
    activeSchoolsGrowthPct: 100,
    usersDelta: 20,
    usersGrowthPct: 80,
    admissionsDelta: 0,
    admissionsGrowthPct: 0,
    feeVolumeGrowthPct: 12.5,
    mrrGrowthPct: 20,
    ticketsDelta: 1,
    ticketsGrowthPct: 100,
  },
  planBreakdown: [
    { plan: "STARTER", label: "Starter", count: 1, percentage: 50 },
    { plan: "PROFESSIONAL", label: "Professional", count: 1, percentage: 50 },
    { plan: "ENTERPRISE", label: "Enterprise", count: 0, percentage: 0 },
  ],
  subscriptionBreakdown: [
    { status: "ACTIVE", label: "Active", count: 1, percentage: 50 },
    { status: "TRIALING", label: "Trialing", count: 1, percentage: 50 },
    { status: "PAST_DUE", label: "Past Due", count: 0, percentage: 0 },
    { status: "CANCELED", label: "Canceled", count: 0, percentage: 0 },
  ],
  boardBreakdown: [{ board: "CBSE", count: 2 }],
  signupTrend: [{ label: "Nov 26", count: 2 }],
  dailySignupTrend: [
    { date: "2026-11-26", label: "Nov 26", count: 1 },
    { date: "2026-11-27", label: "Nov 27", count: 1 },
  ],
  expiringTrials: [],
  recentRegistrations: [],
  recentOpenTickets: [
    {
      id: "t-1",
      referenceCode: "SUP-9001",
      source: "PORTAL_SUPPORT",
      schoolId: "s-1",
      userId: null,
      senderName: "Principal",
      senderEmail: "p@school.example",
      senderPhone: null,
      schoolName: "Green Valley School",
      role: "PRINCIPAL",
      category: "ACCESS",
      subject: "Staff OTP delay",
      message: "Help check OTP delivery",
      rating: null,
      sentiment: null,
      module: "auth",
      status: "OPEN",
      priority: "HIGH",
      resolutionNotes: null,
      resolvedAt: null,
      createdAt: "2026-11-27T04:00:00.000Z",
      updatedAt: "2026-11-27T04:00:00.000Z",
    },
  ],
  recentAuditLogs: [],
  health: {
    databaseConnected: true,
    dbLatencyMs: 14,
    redisConfigured: true,
    redisLatencyMs: 6,
    avgApiResponseMs: 32,
    blockedRequests24h: 0,
    lastCheckedIso: "2026-11-27T05:00:00.000Z",
    platformSchemaProvisioned: true,
    admissionsSchemaProvisioned: true,
    serverTimeIso: "2026-11-27T05:00:00.000Z",
    environment: "test",
  },
};

const mockSchools: PlatformSchoolEntry[] = [
  {
    school: {
      id: "s-1",
      name: "Green Valley Synthetic School",
      slug: "green-valley",
      uniqueId: "SNX-2026-ABCD",
      code: "GVS",
      category: "Co-Ed",
      affiliationBoard: "CBSE",
      contactPhone: "+919800000001",
      contactEmail: "office@gvs.example",
      website: null,
      addressLine: null,
      city: "Pune",
      state: "Maharashtra",
      pinCode: null,
      country: "India",
      status: "ACTIVE",
      plan: "PROFESSIONAL",
      billingCycle: "MONTHLY",
      subscriptionStatus: "ACTIVE",
      maxStudentsLimit: 2000,
      maxStaffLimit: 200,
      enabledModules: {
        admissions: true,
        enquiries: true,
        admittedStudents: true,
        feeLedgers: true,
        customFields: true,
        crmIntegration: true,
        reportsExport: true,
        smsAlerts: true,
      },
      suspendedReason: null,
      internalNotes: null,
      onboardingStep: 4,
      onboardingDone: true,
      trialEndsAt: null,
      createdAt: "2026-11-27T04:00:00.000Z",
    },
    users: [],
    counts: {
      users: 25,
      staffCount: 15,
      studentCount: 100,
      applications: 12,
      enquiries: 5,
      admitted: 100,
      feeCollectedPaise: 5000000,
      saasBilledPaise: 399900,
    },
  },
];

describe("CompanyAdminPanel Command Center Redesign", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, "", "/admin");
    document.documentElement.classList.remove("dark", "light");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/platform/overview")) {
          return new Response(JSON.stringify({ success: true, data: { ...mockOverview, periodDays: 7 } }), {
            status: 200,
          });
        }
        if (url.includes("/api/platform/schools/s-1/data")) {
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                schoolId: "s-1",
                settings: { currentAcademicYear: "2026-27", applicationPrefix: "APP", enabledGrades: ["Class V"] },
                applications: [
                  {
                    id: "app-1",
                    applicationCode: "APP-2026-0001",
                    admissionNumber: "ADM-2026-011",
                    studentName: "Aarav Sharma",
                    gender: "Male",
                    dateOfBirth: "2015-04-12",
                    bloodGroup: "O+",
                    nationality: "Indian",
                    studentIdNumber: "STU-001",
                    previousSchool: "Sunrise Public School",
                    admissionType: "FRESH",
                    gradeApplied: "Class V",
                    academicYear: "2026-27",
                    guardianName: "Rajesh Sharma",
                    guardianRelation: "Father",
                    guardianPhone: "9876543210",
                    guardianEmail: "rajesh.sharma@example.com",
                    fatherName: "Rajesh Sharma",
                    fatherPhone: "9876543210",
                    motherName: "Priya Sharma",
                    motherPhone: "9876500001",
                    studentDetails: {
                      email: "aarav.sharma@example.com",
                      phone: "9876543210",
                      address: { addressLine1: "42 Park Street", city: "Kolkata", state: "WB", postalCode: "700016" },
                    },
                    guardianDetails: {
                      primary: { fullName: "Rajesh Sharma", relationship: "Father", occupation: "Engineer", phone: "9876543210" },
                      secondary: { fullName: "Priya Sharma", relationship: "Mother", phone: "9876500001" },
                      sameAsStudentAddress: true,
                      emergencyContactNumber: "9876543210",
                      preferredCommunicationMode: "WhatsApp",
                    },
                    academicDetails: {
                      previousSchoolName: "Sunrise Public School",
                      boardCurriculum: "CBSE",
                      lastStandardStudied: "Class IV",
                      yearOfCompletion: "2026",
                      percentage: 94.5,
                    },
                    documentsChecklist: [{ key: "birth_cert", label: "Birth Certificate", submitted: true, verified: true }],
                    uploadedDocuments: [],
                    status: "ADMITTED",
                    verificationStatus: "VERIFIED",
                    enrollmentStatus: "ACTIVE",
                    appliedAt: "2026-03-01T10:00:00.000Z",
                    admittedAt: "2026-03-10T10:00:00.000Z",
                  },
                ],
                enquiries: [],
                feeLedgers: [
                  {
                    id: "led-1",
                    applicationId: "app-1",
                    studentName: "Aarav Sharma",
                    academicYear: "2026-27",
                    totalFeePaise: 5000000,
                    concessionPaise: 500000,
                    paidPaise: 3000000,
                    outstandingPaise: 1500000,
                    updatedAt: "2026-03-10T10:00:00.000Z",
                  },
                ],
                feePayments: [
                  {
                    id: "pay-1",
                    applicationId: "app-1",
                    receiptNumber: "REC-2026-001",
                    studentName: "Aarav Sharma",
                    feeHead: "Admission Fee",
                    amountPaise: 3000000,
                    paymentMode: "UPI",
                    paymentDate: "2026-03-10T10:00:00.000Z",
                  },
                ],
                saasInvoices: [],
                supportTickets: [],
              },
            }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ success: true, passkeys: [], users: [], logs: [] }), { status: 200 });
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders redesigned Command Center overview, charts, schools table, health strip, sidebar collapse, and Light/Dark toggle", async () => {
    render(
      <ThemeProvider>
        <CompanyAdminPanel
          adminUser={{
            id: "pa-1",
            name: "Founder Admin",
            email: "founder@scholonix.example",
            platformRole: "SUPER_ADMIN",
            twoFactorEnabled: true,
            passkeyCount: 1,
          }}
          initialOverview={mockOverview}
          initialSchools={mockSchools}
        />
      </ThemeProvider>,
    );

    expect(screen.getByRole("heading", { name: "Platform Overview", level: 2 })).toBeTruthy();
    expect(screen.getByText("MRR (Monthly Recurring)")).toBeTruthy();
    expect(screen.getByText("New School Signups")).toBeTruthy();
    expect(screen.getByText("Schools by Plan")).toBeTruthy();
    expect(screen.getByText("Subscription Status")).toBeTruthy();
    expect(screen.getByText("SUP-9001")).toBeTruthy();
    expect(screen.getByText("All Systems Operational")).toBeTruthy();
    expect(screen.getAllByText("Green Valley Synthetic School").length).toBeGreaterThanOrEqual(1);

    // Collapse sidebar toggles cleanly & persists
    const collapseBtn = screen.getByRole("button", { name: "Collapse sidebar" });
    fireEvent.click(collapseBtn);
    expect(window.localStorage.getItem("snx_platform_sidebar_collapsed")).toBe("true");
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeTruthy();

    // Timeframe selector fetches updated period
    const periodSelect = screen.getByLabelText("Overview timeframe");
    fireEvent.change(periodSelect, { target: { value: "7" } });
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/platform/overview?days=7",
        expect.objectContaining({ cache: "no-store" }),
      );
    });

    // Provision Modal opens directly from Overview button
    fireEvent.click(screen.getByRole("button", { name: /Provision New School/i }));
    expect(screen.getByRole("dialog", { name: "Provision New School" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close provision modal" }));

    // Light -> Dark toggle updates html class cleanly
    const themeBtn = screen.getByRole("button", { name: /Switch to dark mode/i });
    fireEvent.click(themeBtn);
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    expect(screen.getByTitle("Clients")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(screen.getByTitle("Schools")).toBeTruthy();
    expect(screen.getByTitle("Global Users")).toBeTruthy();

    // Clients dropdown toggles cleanly; clicking Schools opens All Schools List and updates URL
    fireEvent.click(screen.getByTitle("Schools"));
    expect(window.location.pathname).toBe("/admin/clients/schools");
    expect(screen.getByTitle("Clients").getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByTitle("Schools").getAttribute("aria-expanded")).toBeNull();
    expect(screen.getByText(/All Schools List/i)).toBeTruthy();
    expect(screen.getAllByText(/Green Valley Synthetic School/i).length).toBeGreaterThanOrEqual(1);

    // Clicking a school opens the full-page All Details view and updates URL
    fireEvent.click(screen.getByRole("button", { name: /View All Details/i }));
    expect(window.location.pathname).toBe("/admin/clients/schools/s-1");
    expect(screen.getByRole("button", { name: /Back to All Schools/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Download Complete School Data/i })).toBeTruthy();
    await waitFor(() => {
      expect(screen.getAllByText(/Aarav Sharma/i).length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(screen.getByRole("button", { name: /Users & Sessions/i }));
    expect(window.location.pathname).toBe("/admin/clients/schools/s-1/users");

    fireEvent.click(screen.getByRole("button", { name: /Students & Parents/i }));
    expect(window.location.pathname).toBe("/admin/clients/schools/s-1/students");
    expect(screen.getByPlaceholderText(/Search student, parent, phone, class/i)).toBeTruthy();

    // Clicking a student opens their dedicated Student Details Dossier and updates URL
    fireEvent.click(screen.getByRole("button", { name: /View Details/i }));
    expect(window.location.pathname).toBe("/admin/clients/schools/s-1/students/app-1");
    expect(screen.getByText(/Student Personal & Contact Details/i)).toBeTruthy();
    expect(screen.getByText(/Parent, Guardian & Emergency Details/i)).toBeTruthy();
    expect(screen.getByText(/Previous School & Academic History/i)).toBeTruthy();
    expect(screen.getByText(/Sunrise Public School/i)).toBeTruthy();
    expect(screen.getByText(/REC-2026-001/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Back to Students List/i }));
    expect(window.location.pathname).toBe("/admin/clients/schools/s-1/students");

    // Returning to All Schools list cleanly works & updates URL
    fireEvent.click(screen.getByRole("button", { name: /Back to All Schools/i }));
    expect(window.location.pathname).toBe("/admin/clients/schools");
    expect(screen.getByText(/All Schools List/i)).toBeTruthy();

    fireEvent.click(screen.getByTitle("Clients"));
    expect(screen.getByTitle("Clients").getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByTitle("Schools")).toBeNull();
    fireEvent.click(screen.getByTitle("Clients"));
    expect(screen.getByTitle("Clients").getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByTitle("Schools")).toBeTruthy();
    for (const label of [
      "Employees",
      "Recruitment",
      "Attendance",
      "Leave & Holidays",
      "Payroll",
      "Expenses",
      "Projects",
      "Tasks",
      "Sales & Invoicing",
      "Documents",
      "Reports",
    ]) {
      expect(screen.getByTitle(label)).toBeTruthy();
    }

    fireEvent.click(screen.getByTitle("Reports"));
    expect(screen.getByText(/Platform Reports & Exports/i)).toBeTruthy();

    // Navigate to Settings tab
    fireEvent.click(screen.getByTitle("Settings"));
    expect(window.location.pathname).toBe("/admin/settings");
    expect(screen.getByText(/Company Portal & Account Settings/i)).toBeTruthy();

    // Verify nested URL parser supports both canonical and singular/short route segments
    expect(parsePlatformSubSegments(["clint", "school", "school-1", "student", "app-1"])).toEqual({
      tab: "schools",
      schoolId: "school-1",
      schoolSubTab: "students",
      studentId: "app-1",
    });
    expect(
      buildPlatformRouteUrl("/company-admin-pannel", {
        tab: "schools",
        schoolId: "school-1",
        schoolSubTab: "students",
        studentId: "app-1",
      }),
    ).toBe("/company-admin-pannel/clients/schools/school-1/students/app-1");
  });
});
