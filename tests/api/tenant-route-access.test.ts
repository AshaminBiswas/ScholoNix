import { randomBytes } from "crypto";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { authRepository } from "@/server/auth/auth-repository";
import { getSessionCookieName, sessionService } from "@/server/auth/session-service";
import { hashPassword } from "@/server/security/crypto";

const mockCookieGet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: mockCookieGet,
  })),
}));

class NextRedirectSignal extends Error {
  constructor(public readonly url: string) {
    super(`REDIRECT:${url}`);
  }
}

class NextNotFoundSignal extends Error {
  constructor() {
    super("NOT_FOUND");
  }
}

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new NextRedirectSignal(url);
  }),
  notFound: vi.fn(() => {
    throw new NextNotFoundSignal();
  }),
}));

async function seedTenant(tag: string) {
  const unique = `${tag}-${Date.now()}-${randomBytes(3).toString("hex")}`.toLowerCase();
  const passwordHash = await hashPassword(`Route!${randomBytes(8).toString("hex")}3`);
  return authRepository.createUserWithSchool({
    school: {
      name: `Route School ${tag} ${unique}`,
      slug: `route-school-${unique}`,
      code: `RS-${randomBytes(3).toString("hex").toUpperCase()}`,
      category: "Co-Educational School",
      affiliationBoard: "CBSE",
      city: "Jaipur",
      state: "Rajasthan",
      pinCode: "302001",
      country: "India",
    },
    user: {
      name: `Route Admin ${tag}`,
      email: `route.${unique}@scholonix.example`,
      phone: `+9197${Math.floor(10000000 + Math.random() * 89999999)}`,
      passwordHash,
      role: "SCHOOL_ADMIN",
      phoneVerified: true,
      emailVerified: true,
    },
  });
}

describe("Per-School URL Route Authorization (resolveTenantRouteAccess)", () => {
  beforeEach(() => {
    mockCookieGet.mockReset();
  });

  it("returns 404 (notFound) for reserved platform routes", async () => {
    const { resolveTenantRouteAccess } = await import("@/server/school/resolve-tenant-route");
    await expect(resolveTenantRouteAccess("help", "/help")).rejects.toBeInstanceOf(
      NextNotFoundSignal,
    );
    await expect(resolveTenantRouteAccess("login", "/login")).rejects.toBeInstanceOf(
      NextNotFoundSignal,
    );
  });

  it("redirects unauthenticated visitors to the school's unique /{slug}/login with callbackUrl", async () => {
    mockCookieGet.mockReturnValue(undefined);
    const { resolveTenantRouteAccess } = await import("@/server/school/resolve-tenant-route");

    await expect(
      resolveTenantRouteAccess("sc_testopaquetoken1234", "/sc_testopaquetoken1234/help"),
    ).rejects.toMatchObject({
      url: "/sc_testopaquetoken1234/login?callbackUrl=%2Fsc_testopaquetoken1234%2Fhelp",
    });
  });

  it("grants access to authorized school workspace and help routes, and blocks another school's slug", async () => {
    const { school: schoolA, user: userA } = await seedTenant("A");
    const { school: schoolB } = await seedTenant("B");
    const sessionA = await sessionService.createSession(userA);
    const cookieName = getSessionCookieName();

    mockCookieGet.mockImplementation((name: string) =>
      name === cookieName ? { value: sessionA.token } : undefined,
    );

    const { resolveTenantRouteAccess } = await import("@/server/school/resolve-tenant-route");

    const ownWorkspace = await resolveTenantRouteAccess(schoolA.slug, `/${schoolA.slug}`);
    expect(ownWorkspace.authorized).toBe(true);
    if (ownWorkspace.authorized) {
      expect(ownWorkspace.school.id).toBe(schoolA.id);
    }

    const ownHelp = await resolveTenantRouteAccess(schoolA.slug, `/${schoolA.slug}/help`);
    expect(ownHelp.authorized).toBe(true);

    const crossTenantAttempt = await resolveTenantRouteAccess(
      schoolB.slug,
      `/${schoolB.slug}`,
    );
    expect(crossTenantAttempt.authorized).toBe(false);
    if (!crossTenantAttempt.authorized) {
      expect(crossTenantAttempt.reason).toBe("TENANT_MISMATCH");
      if (crossTenantAttempt.reason === "TENANT_MISMATCH") {
        expect(crossTenantAttempt.ownSchool.id).toBe(schoolA.id);
      }
    }
  });

  it("returns SERVICE_UNAVAILABLE instead of throwing when session verification encounters a transient database failure", async () => {
    const { school: schoolA, user: userA } = await seedTenant("Resilience");
    const sessionA = await sessionService.createSession(userA);
    const cookieName = getSessionCookieName();
    const { ServiceUnavailableError } = await import("@/lib/errors");

    mockCookieGet.mockImplementation((name: string) =>
      name === cookieName ? { value: sessionA.token } : undefined,
    );

    const spy = vi
      .spyOn(sessionService, "verifyToken")
      .mockRejectedValueOnce(new ServiceUnavailableError("Database temporarily unreachable"));

    try {
      const { resolveTenantRouteAccess } = await import("@/server/school/resolve-tenant-route");
      const result = await resolveTenantRouteAccess(schoolA.slug, `/${schoolA.slug}`);
      expect(result.authorized).toBe(false);
      if (!result.authorized && result.reason === "SERVICE_UNAVAILABLE") {
        expect(result.message).toMatch(/temporarily unreachable/i);
      } else {
        throw new Error(`Expected SERVICE_UNAVAILABLE, got ${JSON.stringify(result)}`);
      }
    } finally {
      spy.mockRestore();
    }
  });
});
