// @vitest-environment jsdom
import * as React from "react";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ServiceUnavailableError } from "@/lib/errors";

const mockGetOverview = vi.fn();
const mockResolveTenantRouteAccess = vi.fn();

vi.mock("@/server/school/resolve-tenant-route", () => ({
  resolveTenantRouteAccess: (...args: unknown[]) => mockResolveTenantRouteAccess(...args),
}));

vi.mock("@/server/school/admissions-service", () => ({
  admissionsService: {
    getOverview: (...args: unknown[]) => mockGetOverview(...args),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("SchoolAdmissionsPage Server Component resilience", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockGetOverview.mockReset();
    mockResolveTenantRouteAccess.mockReset();
    mockResolveTenantRouteAccess.mockImplementation(async (slug: string) => ({
      authorized: true,
      session: {
        sessionId: "sess-1",
        user: {
          id: "user-1",
          name: "Principal Test",
          role: "PRINCIPAL",
          email: "principal@scholonix.example",
          phone: "+919000000001",
        },
        school: null,
      },
      school: {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Synthetic Resilience School",
        slug,
        code: "SRS-1",
        affiliationBoard: "CBSE",
      },
    }));
  });

  it("renders a branded migration setup notice instead of crashing SSR when ServiceUnavailableError occurs", async () => {
    mockGetOverview.mockRejectedValue(
      new ServiceUnavailableError(
        "Admissions database tables are not provisioned yet. Execute migration.sql in Supabase SQL Editor.",
      ),
    );

    const { default: SchoolAdmissionsPage } = await import(
      "@/app/(school)/[schoolSlug]/admissions/page"
    );

    const jsx = await SchoolAdmissionsPage({
      params: Promise.resolve({ schoolSlug: "synthetic-resilience-school" }),
      searchParams: Promise.resolve({ tab: "overview" }),
    });

    render(jsx as React.ReactElement);

    expect(
      screen.getByRole("heading", { name: /Admissions Setup Pending Database Migration/i }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: /Back to Dashboard/i }).getAttribute("href")).toBe(
      "/synthetic-resilience-school",
    );
  });

  it("renders TenantServiceUnavailableView instead of throwing when resolveTenantRouteAccess returns SERVICE_UNAVAILABLE", async () => {
    mockResolveTenantRouteAccess.mockResolvedValue({
      authorized: false,
      reason: "SERVICE_UNAVAILABLE",
      message: "Authentication database is temporarily unavailable. Please try again in a moment.",
    });

    const { default: SchoolAdmissionsPage } = await import(
      "@/app/(school)/[schoolSlug]/admissions/page"
    );

    const jsx = await SchoolAdmissionsPage({
      params: Promise.resolve({ schoolSlug: "synthetic-resilience-school" }),
      searchParams: Promise.resolve({ tab: "overview" }),
    });

    render(jsx as React.ReactElement);

    expect(screen.getByRole("heading", { name: /Workspace Temporarily Unavailable/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Try Again/i })).toBeTruthy();
  });
});
