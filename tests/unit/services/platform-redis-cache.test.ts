import { beforeEach, describe, expect, it, vi } from "vitest";

const { memoryKv, failMode } = vi.hoisted(() => ({
  memoryKv: new Map<string, unknown>(),
  failMode: { throwOnCache: false },
}));

vi.mock("@/server/integrations/redis", () => ({
  buildTenantCacheKey: (schoolId: string, key: string) => `tenant:${schoolId}:${key}`,
  buildSystemCacheKey: (key: string) => `system:${key}`,
  systemCache: {
    get: vi.fn(async (key: string) => {
      if (failMode.throwOnCache) throw new Error("Redis outage simulated");
      return memoryKv.get(`system:${key}`) ?? null;
    }),
    set: vi.fn(async (key: string, value: unknown) => {
      if (failMode.throwOnCache) throw new Error("Redis outage simulated");
      memoryKv.set(`system:${key}`, value);
    }),
    del: vi.fn(async (key: string) => {
      memoryKv.delete(`system:${key}`);
    }),
    incrVersion: vi.fn(async (key: string) => {
      if (failMode.throwOnCache) throw new Error("Redis outage simulated");
      const fullKey = `system:${key}`;
      const next = (Number(memoryKv.get(fullKey) ?? 1) || 1) + 1;
      memoryKv.set(fullKey, next);
      return next;
    }),
  },
  tenantCache: {
    get: vi.fn(async (schoolId: string, key: string) => {
      if (failMode.throwOnCache) throw new Error("Redis outage simulated");
      return memoryKv.get(`tenant:${schoolId}:${key}`) ?? null;
    }),
    set: vi.fn(async (schoolId: string, key: string, value: unknown) => {
      if (failMode.throwOnCache) throw new Error("Redis outage simulated");
      memoryKv.set(`tenant:${schoolId}:${key}`, value);
    }),
    del: vi.fn(async (schoolId: string, key: string) => {
      memoryKv.delete(`tenant:${schoolId}:${key}`);
    }),
  },
}));

import { platformCache } from "@/server/platform/platform-cache";
import { systemCache, tenantCache } from "@/server/integrations/redis";
import type {
  PlatformAdminRecord,
  PlatformOverviewData,
  PlatformSchoolDataInspectResult,
  PlatformSchoolEntry,
} from "@/modules/platform/types";

describe("platformCache Upstash Redis acceleration layer", () => {
  beforeEach(() => {
    memoryKv.clear();
    failMode.throwOnCache = false;
    vi.clearAllMocks();
  });

  it("caches overview + schools directory in Redis and skips repeat database calls", async () => {
    const dbLoader = vi.fn(async () => ({
      overview: { kpis: { totalSchools: 2 } } as PlatformOverviewData,
      schools: [{ school: { id: "s-1", name: "Alpha Academy" } }] as PlatformSchoolEntry[],
    }));

    const first = await platformCache.getOrLoadOverviewWithSchools(30, dbLoader);
    const second = await platformCache.getOrLoadOverviewWithSchools(30, dbLoader);
    const schoolsList = await platformCache.getOrLoadAllSchools(async () => {
      throw new Error("Should read warmed schools cache instead of querying DB");
    });

    expect(dbLoader).toHaveBeenCalledTimes(1);
    expect(first.schools[0]?.school.name).toBe("Alpha Academy");
    expect(second.overview.kpis.totalSchools).toBe(2);
    expect(schoolsList[0]?.school.id).toBe("s-1");
    expect(systemCache.set).toHaveBeenCalled();
  });

  it("enforces tenant-scoped inspect keys and targeted invalidation without touching other schools", async () => {
    const loaderS1 = vi.fn(
      async (): Promise<PlatformSchoolDataInspectResult> => ({
        schoolId: "s-1",
        settings: null,
        applications: [],
        enquiries: [],
        feeLedgers: [],
        feePayments: [],
      }),
    );
    const loaderS2 = vi.fn(
      async (): Promise<PlatformSchoolDataInspectResult> => ({
        schoolId: "s-2",
        settings: null,
        applications: [],
        enquiries: [],
        feeLedgers: [],
        feePayments: [],
      }),
    );

    await platformCache.getOrLoadSchoolInspect("s-1", loaderS1);
    await platformCache.getOrLoadSchoolInspect("s-2", loaderS2);
    await platformCache.getOrLoadSchoolInspect("s-1", loaderS1);

    expect(loaderS1).toHaveBeenCalledTimes(1);
    expect(loaderS2).toHaveBeenCalledTimes(1);
    expect(tenantCache.set).toHaveBeenCalledWith(
      "s-1",
      "platform:inspect",
      expect.objectContaining({ schoolId: "s-1" }),
      expect.any(Number),
    );

    // Invalidating s-1 forces reload for s-1 only while s-2 stays warm
    await platformCache.invalidateSchool("s-1");
    await platformCache.getOrLoadSchoolInspect("s-1", loaderS1);
    await platformCache.getOrLoadSchoolInspect("s-2", loaderS2);

    expect(loaderS1).toHaveBeenCalledTimes(2);
    expect(loaderS2).toHaveBeenCalledTimes(1);
  });

  it("caches platform admin sessions and invalidates immediately on adminVersion bump", async () => {
    const admin: PlatformAdminRecord = {
      id: "pa-1",
      name: "Super Admin",
      email: "super@scholonix.example",
      phone: null,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      department: null,
      lastLoginAt: null,
      createdByAdminId: null,
      mustChangePassword: false,
      passwordChangedAt: null,
      emailVerifiedAt: "2026-01-01T00:00:00.000Z",
      phoneVerifiedAt: "2026-01-01T00:00:00.000Z",
      twoFactorEnabled: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    await platformCache.setCachedAdminSession("tok-hash-1", admin, true);
    const hit = await platformCache.getCachedAdminSession("tok-hash-1");
    expect(hit?.admin.email).toBe("super@scholonix.example");
    expect(hit?.mfaVerified).toBe(true);

    // Password change / MFA reset / suspension bumps admin version -> cached session immediately invalidated
    await platformCache.bumpAdminVersion("pa-1");
    const afterBump = await platformCache.getCachedAdminSession("tok-hash-1");
    expect(afterBump).toBeNull();
  });

  it("falls back cleanly to the database loader during a Redis outage", async () => {
    failMode.throwOnCache = true;
    const fallbackSchools = [{ school: { id: "s-fallback", name: "Fallback School" } }] as PlatformSchoolEntry[];
    const res = await platformCache.getOrLoadAllSchools(async () => fallbackSchools);
    expect(res[0]?.school.id).toBe("s-fallback");
  });
});
