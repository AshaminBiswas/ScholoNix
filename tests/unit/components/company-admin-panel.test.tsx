// @vitest-environment jsdom
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompanyAdminPanel } from "@/modules/platform/components/company-admin-panel";
import {
  DEFAULT_PLATFORM_MODULE_FLAGS,
  type PlatformOverviewData,
  type PlatformSchoolEntry,
} from "@/modules/platform/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("CompanyAdminPanel UI", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const sampleSchool: PlatformSchoolEntry = {
    school: {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Horizon Synthetic Academy",
      slug: "sc_abc123456789",
      uniqueId: "SNX-2026-7K4M9P",
      code: "HSA-01",
      category: "Co-Educational School",
      affiliationBoard: "CBSE",
      contactPhone: "+919876543210",
      contactEmail: "admin@horizon.example",
      website: null,
      addressLine: "12 MG Road",
      city: "Jaipur",
      state: "Rajasthan",
      pinCode: "302001",
      country: "India",
      status: "ACTIVE",
      plan: "PROFESSIONAL",
      billingCycle: "MONTHLY",
      subscriptionStatus: "ACTIVE",
      maxStudentsLimit: 2000,
      maxStaffLimit: 200,
      enabledModules: { ...DEFAULT_PLATFORM_MODULE_FLAGS },
      suspendedReason: null,
      internalNotes: null,
      onboardingStep: 4,
      onboardingDone: true,
      trialEndsAt: null,
      createdAt: "2026-11-01T00:00:00.000Z",
    },
    users: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        schoolId: "11111111-1111-4111-8111-111111111111",
        name: "Principal Synthetic",
        email: "principal@horizon.example",
        phone: "+919876543210",
        role: "PRINCIPAL",
        status: "ACTIVE",
        emailVerified: true,
        phoneVerified: true,
        activeSessionCount: 1,
        createdAt: "2026-11-01T00:00:00.000Z",
      },
    ],
    counts: {
      users: 1,
      applications: 14,
      enquiries: 22,
      admitted: 9,
      feeCollectedPaise: 4_500_000,
      saasBilledPaise: 399_900,
    },
  };

  const sampleOverview: PlatformOverviewData = {
    kpis: {
      totalSchools: 1,
      activeSchools: 1,
      trialSchools: 0,
      suspendedSchools: 0,
      totalUsers: 1,
      totalApplications: 14,
      totalEnquiries: 22,
      totalAdmittedStudents: 9,
      studentFeeCollectedPaise: 4_500_000,
      saasRevenueCollectedPaise: 399_900,
      saasPendingPaise: 0,
      openSupportTickets: 2,
    },
    planBreakdown: [
      { plan: "STARTER", label: "Starter", count: 0, percentage: 0 },
      { plan: "PROFESSIONAL", label: "Professional", count: 1, percentage: 100 },
      { plan: "ENTERPRISE", label: "Enterprise", count: 0, percentage: 0 },
    ],
    boardBreakdown: [{ board: "CBSE", count: 1 }],
    signupTrend: [{ label: "Nov 26", count: 1 }],
    expiringTrials: [],
    recentAuditLogs: [],
    health: {
      databaseConnected: true,
      dbLatencyMs: 12,
      redisConfigured: true,
      platformSchemaProvisioned: true,
      admissionsSchemaProvisioned: true,
      serverTimeIso: "2026-11-27T05:00:00.000Z",
      environment: "test",
    },
  };

  it("navigates across Company Admin sections, opens Provision School modal, and inspects school governance tabs", async () => {
    const actor = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      new Response(
        JSON.stringify({
          success: true,
          admins: [],
          users: sampleSchool.users,
          invoices: [],
          tickets: [],
          logs: [],
          announcements: [],
          health: sampleOverview.health,
          data: {
            schoolId: sampleSchool.school.id,
            settings: { currentAcademicYear: "2026 – 2027", applicationPrefix: "APP", enabledGrades: ["Class I"] },
            applications: [],
            enquiries: [],
            feeLedgers: [],
            feePayments: [],
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    render(
      <CompanyAdminPanel
        adminUser={{ id: "admin-1", name: "Founder Admin", email: "founder@scholonix.example" }}
        initialOverview={sampleOverview}
        initialSchools={[sampleSchool]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Company Admin Panel", level: 1 })).toBeTruthy();
    expect(screen.getByText("Total Schools")).toBeTruthy();
    expect(screen.getByText("MRR (Monthly Recurring)")).toBeTruthy();

    // Switch to Schools
    await actor.click(screen.getByTitle("Schools"));
    expect(screen.getAllByText("Horizon Synthetic Academy").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("SNX-2026-7K4M9P").length).toBeGreaterThanOrEqual(1);

    // Open Provision New School modal
    await actor.click(screen.getByRole("button", { name: /Provision New School/i }));
    expect(screen.getByRole("dialog", { name: "Provision New School" })).toBeTruthy();
    await actor.click(screen.getByRole("button", { name: "Close provision modal" }));

    // Inspect Plan & Modules sub-tab
    await actor.click(screen.getByRole("button", { name: /Plan & Modules/i }));
    expect(screen.getByText("Per-School Feature Modules")).toBeTruthy();
    expect(screen.getByText("Save Plan, Quotas & Feature Flags")).toBeTruthy();

    // Switch to Plans & Billing, Support, Security & Health (Audit + Company Admins), Announcements
    await actor.click(screen.getByTitle("Plans & Billing"));
    expect(screen.getByText(/SaaS Subscriptions & Company Billing/i)).toBeTruthy();

    await actor.click(screen.getByTitle("Support & Feedback"));
    expect(screen.getByText(/Support, Contact & Feedback Inbox/i)).toBeTruthy();

    await actor.click(screen.getByTitle("Security & Health"));
    await actor.click(screen.getByRole("button", { name: /Audit & Health/i }));
    expect(screen.getByText(/Immutable Security & Governance Audit Logs/i)).toBeTruthy();

    await actor.click(screen.getByRole("button", { name: /Company Admins/i }));
    expect(screen.getByText(/Company Admins & Management Team/i)).toBeTruthy();

    await actor.click(screen.getByTitle("Announcements"));
    expect(screen.getByText(/Platform Announcements & Maintenance Notices/i)).toBeTruthy();
  });
});
