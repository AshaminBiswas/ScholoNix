// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));

import { ThemeProvider } from "@/components/theme/theme-provider";
import { CompanyAdminPanel } from "@/modules/platform/components/company-admin-panel";
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
        return new Response(JSON.stringify({ success: true, passkeys: [] }), { status: 200 });
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

    // Navigate to Settings tab
    fireEvent.click(screen.getByTitle("Settings"));
    expect(screen.getByText(/Company Portal & Account Settings/i)).toBeTruthy();
  });
});
