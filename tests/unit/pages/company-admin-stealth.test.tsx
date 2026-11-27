// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const mockCookiesGet = vi.fn();
const mockVerifyToken = vi.fn();
const mockPlatformVerifySessionToken = vi.fn();
const mockNotFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
const mockRedirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (...args: unknown[]) => mockCookiesGet(...args),
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: () => mockNotFound(),
  redirect: (url: string) => mockRedirect(url),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock("@/server/auth/session-service", () => ({
  getSessionCookieName: () => "scholonix_session",
  sessionService: {
    verifyToken: (...args: unknown[]) => mockVerifyToken(...args),
  },
}));

vi.mock("@/server/platform/platform-admin-auth", () => ({
  getPlatformAdminCookieName: () => "platform_admin_session",
  isPlatformAdminFullyVerified: (
    admin: {
      mustChangePassword: boolean;
      emailVerifiedAt: string | null;
      phoneVerifiedAt: string | null;
      twoFactorEnabled: boolean;
      passkeyCount?: number;
    },
    mfaVerified: boolean,
  ) =>
    !admin.mustChangePassword &&
    Boolean(admin.emailVerifiedAt) &&
    Boolean(admin.phoneVerifiedAt) &&
    mfaVerified &&
    (admin.twoFactorEnabled || (admin.passkeyCount ?? 0) > 0),
  platformAdminAuthService: {
    verifySessionToken: (...args: unknown[]) => mockPlatformVerifySessionToken(...args),
  },
}));

vi.mock("@/server/platform/platform-service", () => ({
  platformService: {
    getOverview: async () => ({
      kpis: {
        totalSchools: 0,
        activeSchools: 0,
        trialSchools: 0,
        suspendedSchools: 0,
        totalUsers: 0,
        totalApplications: 0,
        totalEnquiries: 0,
        totalAdmittedStudents: 0,
        studentFeeCollectedPaise: 0,
        saasRevenueCollectedPaise: 0,
        saasPendingPaise: 0,
        openSupportTickets: 0,
      },
      planBreakdown: [],
      boardBreakdown: [],
      signupTrend: [],
      expiringTrials: [],
      recentAuditLogs: [],
      health: {
        databaseConnected: true,
        dbLatencyMs: 1,
        redisConfigured: false,
        platformSchemaProvisioned: true,
        admissionsSchemaProvisioned: true,
        serverTimeIso: "2026-11-27T05:00:00.000Z",
        environment: "test",
      },
    }),
    listSchools: async () => [],
  },
}));

import {
  getConfiguredPlatformAdminSlug,
  getPlatformAdminPath,
} from "@/server/platform/admin-route-config";
import { renderCompanyAdminPage } from "@/server/platform/render-company-admin";
import { isReservedSchoolSlug } from "@/modules/schools/services/registration-service";

describe("Company Admin Stealth 404 & PLATFORM_ADMIN_SLUG Gate", () => {
  const originalSlug = process.env.PLATFORM_ADMIN_SLUG;

  beforeEach(() => {
    mockCookiesGet.mockReset();
    mockVerifyToken.mockReset();
    mockPlatformVerifySessionToken.mockReset();
    mockPlatformVerifySessionToken.mockResolvedValue(null);
    mockNotFound.mockClear();
    mockRedirect.mockClear();
    process.env.PLATFORM_ADMIN_SLUG = "hq-9f4k2m7p";
  });

  afterEach(() => {
    cleanup();
    if (originalSlug === undefined) delete process.env.PLATFORM_ADMIN_SLUG;
    else process.env.PLATFORM_ADMIN_SLUG = originalSlug;
  });

  it("disables /admin with 404 when PLATFORM_ADMIN_SLUG is configured and reserves the secret slug", async () => {
    expect(getConfiguredPlatformAdminSlug()).toBe("hq-9f4k2m7p");
    expect(getPlatformAdminPath()).toBe("/hq-9f4k2m7p");
    expect(isReservedSchoolSlug("hq-9f4k2m7p")).toBe(true);

    await expect(renderCompanyAdminPage("admin")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("returns 404 (stealth) for non-super-admin school users and shows dedicated Company Admin Sign In on configured secret slug when unauthenticated", async () => {
    mockCookiesGet.mockReturnValue(undefined);
    const loginEl = await renderCompanyAdminPage("hq-9f4k2m7p");
    render(loginEl);
    expect(screen.getByRole("heading", { name: "Company Admin Sign In", level: 1 })).toBeTruthy();

    mockCookiesGet.mockReturnValue({ value: "valid-token" });
    mockVerifyToken.mockResolvedValue({
      user: {
        id: "user-1",
        name: "Principal",
        email: "p@school.example",
        role: "PRINCIPAL",
        status: "ACTIVE",
        schoolId: "11111111-1111-4111-8111-111111111111",
      },
    });
    await expect(renderCompanyAdminPage("hq-9f4k2m7p")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders CompanyAdminPanel only for ACTIVE PLATFORM_SUPER_ADMIN on the configured secret path", async () => {
    mockCookiesGet.mockReturnValue({ value: "super-token" });
    mockVerifyToken.mockResolvedValue({
      user: {
        id: "super-1",
        name: "Platform Founder",
        email: "founder@scholonix.example",
        role: "PLATFORM_SUPER_ADMIN",
        status: "ACTIVE",
        schoolId: null,
      },
    });

    const el = await renderCompanyAdminPage("hq-9f4k2m7p");
    render(el);
    expect(screen.getByRole("heading", { name: "Company Admin Panel", level: 1 })).toBeTruthy();
  });

  it("renders mandatory Security Gate when platform_admin still needs password change or MFA verification", async () => {
    mockCookiesGet.mockImplementation((name: string) =>
      name === "platform_admin_session" ? { value: "plat-tok" } : undefined,
    );

    mockPlatformVerifySessionToken.mockResolvedValueOnce({
      admin: {
        id: "pa-1",
        name: "First Login Founder",
        email: "founder@scholonix.example",
        phone: "+919876500999",
        role: "SUPER_ADMIN",
        mustChangePassword: true,
        emailVerifiedAt: null,
        phoneVerifiedAt: null,
        twoFactorEnabled: false,
        passkeyCount: 0,
      },
      mfaVerified: false,
    });
    const gateEl = await renderCompanyAdminPage("hq-9f4k2m7p");
    render(gateEl);
    expect(
      screen.getByRole("heading", { name: "Change Initial Password", level: 1 }),
    ).toBeTruthy();

    cleanup();
    mockPlatformVerifySessionToken.mockResolvedValueOnce({
      admin: {
        id: "pa-1",
        name: "Contact Pending Founder",
        email: "founder@scholonix.example",
        phone: "+919876500999",
        role: "SUPER_ADMIN",
        mustChangePassword: false,
        emailVerifiedAt: null,
        phoneVerifiedAt: null,
        twoFactorEnabled: false,
        passkeyCount: 0,
      },
      mfaVerified: false,
    });
    const contactEl = await renderCompanyAdminPage("hq-9f4k2m7p");
    render(contactEl);
    expect(
      screen.getByRole("heading", { name: "Verify Email & Phone Number", level: 1 }),
    ).toBeTruthy();

    cleanup();
    mockPlatformVerifySessionToken.mockResolvedValueOnce({
      admin: {
        id: "pa-1",
        name: "Returning Founder",
        email: "founder@scholonix.example",
        phone: "+919876500999",
        role: "SUPER_ADMIN",
        mustChangePassword: false,
        emailVerifiedAt: "2026-11-27T05:00:00.000Z",
        phoneVerifiedAt: "2026-11-27T05:00:00.000Z",
        twoFactorEnabled: true,
        passkeyCount: 0,
      },
      mfaVerified: false,
    });
    const challengeEl = await renderCompanyAdminPage("hq-9f4k2m7p");
    render(challengeEl);
    expect(
      screen.getByRole("heading", { name: "Verify Your Identity", level: 1 }),
    ).toBeTruthy();
  });
});
