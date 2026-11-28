import "server-only";
import { createHash } from "crypto";
import { systemCache, tenantCache } from "@/server/integrations/redis";
import type {
  PlatformAdminRecord,
  PlatformAnnouncementRecord,
  PlatformAuditLogRecord,
  PlatformHealthSnapshot,
  PlatformInvoiceRecord,
  PlatformOverviewData,
  PlatformOverviewPeriodDays,
  PlatformSchoolDataInspectResult,
  PlatformSchoolEntry,
  PlatformSchoolUserItem,
  PlatformSupportTicketRecord,
} from "@/modules/platform/types";

const GLOBAL_VER_KEY = "platform:ver:global";
const ADMINS_VER_KEY = "platform:ver:admins";
const SCHOOL_INSPECT_RESOURCE = "platform:inspect";
const SCHOOL_USERS_RESOURCE = "platform:users";

const VER_TTL_SECONDS = 86_400; // 24h
const OVERVIEW_TTL_SECONDS = 60;
const SCHOOLS_TTL_SECONDS = 90;
const SCHOOL_DETAIL_TTL_SECONDS = 90;
const LIST_TTL_SECONDS = 60;
const AUDIT_TTL_SECONDS = 30;
const HEALTH_TTL_SECONDS = 15;
const SESSION_TTL_SECONDS = 120;

const inFlightLoads = new Map<string, Promise<unknown>>();

function withTtlJitter(baseSeconds: number): number {
  // Add up to +15% jitter so synchronized cache entries do not stampede together
  const jitter = Math.max(1, Math.round(baseSeconds * 0.15 * Math.random()));
  return baseSeconds + jitter;
}

function hashFilterParts(parts: Array<string | undefined | null>): string {
  const normalized = parts.map((p) => (p ?? "").trim().toLowerCase()).join("|");
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

async function singleFlight<T>(flightKey: string, loader: () => Promise<T>): Promise<T> {
  const existing = inFlightLoads.get(flightKey) as Promise<T> | undefined;
  if (existing) {
    return existing;
  }
  const promise = loader().finally(() => {
    inFlightLoads.delete(flightKey);
  });
  inFlightLoads.set(flightKey, promise);
  return promise;
}

async function readVersion(versionKey: string): Promise<number> {
  try {
    const cached = await systemCache.get<number>(versionKey);
    if (typeof cached === "number" && Number.isFinite(cached) && cached > 0) {
      return cached;
    }
  } catch {
    // Fallback cleanly when Redis is unavailable
  }
  return 1;
}

async function bumpVersion(versionKey: string): Promise<number> {
  try {
    return await systemCache.incrVersion(versionKey, VER_TTL_SECONDS);
  } catch {
    return 1;
  }
}

async function safeGetSystem<T>(key: string): Promise<T | null> {
  try {
    return await systemCache.get<T>(key);
  } catch {
    return null;
  }
}

async function safeSetSystem<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    await systemCache.set(key, value, ttlSeconds);
  } catch {
    // Graceful degradation on Redis outage
  }
}

async function safeGetTenant<T>(schoolId: string, resource: string): Promise<T | null> {
  try {
    return await tenantCache.get<T>(schoolId, resource);
  } catch {
    return null;
  }
}

async function safeSetTenant<T>(
  schoolId: string,
  resource: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  try {
    await tenantCache.set(schoolId, resource, value, ttlSeconds);
  } catch {
    // Graceful degradation on Redis outage
  }
}

export interface CachedPlatformAdminSessionPayload {
  admin: PlatformAdminRecord;
  mfaVerified: boolean;
  adminVersion: number;
}

export const platformCache = {
  async getGlobalVersion(): Promise<number> {
    return readVersion(GLOBAL_VER_KEY);
  },

  async bumpGlobalVersion(): Promise<void> {
    await bumpVersion(GLOBAL_VER_KEY);
  },

  async bumpAdminsListVersion(): Promise<void> {
    await bumpVersion(ADMINS_VER_KEY);
  },

  async getAdminVersion(adminId: string): Promise<number> {
    return readVersion(`platform:ver:admin:${adminId}`);
  },

  async bumpAdminVersion(adminId: string): Promise<void> {
    await Promise.all([
      bumpVersion(`platform:ver:admin:${adminId}`),
      bumpVersion(ADMINS_VER_KEY),
    ]);
  },

  async invalidateSchool(schoolId: string): Promise<void> {
    await Promise.all([
      tenantCache.del(schoolId, SCHOOL_INSPECT_RESOURCE).catch(() => {}),
      tenantCache.del(schoolId, SCHOOL_USERS_RESOURCE).catch(() => {}),
      bumpVersion(GLOBAL_VER_KEY),
    ]);
  },

  // --- Platform Overview + Schools Bundle ---
  async getOrLoadOverviewWithSchools(
    periodDays: PlatformOverviewPeriodDays,
    loader: () => Promise<{ overview: PlatformOverviewData; schools: PlatformSchoolEntry[] }>,
  ): Promise<{ overview: PlatformOverviewData; schools: PlatformSchoolEntry[] }> {
    const ver = await readVersion(GLOBAL_VER_KEY);
    const cacheKey = `platform:overview:v${ver}:d${periodDays}`;
    const cached = await safeGetSystem<{
      overview: PlatformOverviewData;
      schools: PlatformSchoolEntry[];
    }>(cacheKey);
    if (cached) return cached;

    return singleFlight(cacheKey, async () => {
      const fresh = await loader();
      await Promise.all([
        safeSetSystem(cacheKey, fresh, withTtlJitter(OVERVIEW_TTL_SECONDS)),
        safeSetSystem(
          `platform:schools:v${ver}:all`,
          fresh.schools,
          withTtlJitter(SCHOOLS_TTL_SECONDS),
        ),
      ]);
      return fresh;
    });
  },

  // --- Full Schools Directory (filtered in-memory cleanly after Redis load) ---
  async getOrLoadAllSchools(
    loader: () => Promise<PlatformSchoolEntry[]>,
  ): Promise<PlatformSchoolEntry[]> {
    const ver = await readVersion(GLOBAL_VER_KEY);
    const cacheKey = `platform:schools:v${ver}:all`;
    const cached = await safeGetSystem<PlatformSchoolEntry[]>(cacheKey);
    if (cached) return cached;

    return singleFlight(cacheKey, async () => {
      const fresh = await loader();
      await safeSetSystem(cacheKey, fresh, withTtlJitter(SCHOOLS_TTL_SECONDS));
      return fresh;
    });
  },

  // --- Tenant-Scoped School Inspection (Students, Parents, Ledgers, Invoices, Tickets) ---
  async getOrLoadSchoolInspect(
    schoolId: string,
    loader: () => Promise<PlatformSchoolDataInspectResult>,
  ): Promise<PlatformSchoolDataInspectResult> {
    const cached = await safeGetTenant<PlatformSchoolDataInspectResult>(
      schoolId,
      SCHOOL_INSPECT_RESOURCE,
    );
    if (cached) return cached;

    return singleFlight(`tenant:${schoolId}:${SCHOOL_INSPECT_RESOURCE}`, async () => {
      const fresh = await loader();
      await safeSetTenant(
        schoolId,
        SCHOOL_INSPECT_RESOURCE,
        fresh,
        withTtlJitter(SCHOOL_DETAIL_TTL_SECONDS),
      );
      return fresh;
    });
  },

  // --- Tenant-Scoped School Users ---
  async getOrLoadSchoolUsers(
    schoolId: string,
    loader: () => Promise<PlatformSchoolUserItem[]>,
  ): Promise<PlatformSchoolUserItem[]> {
    const cached = await safeGetTenant<PlatformSchoolUserItem[]>(
      schoolId,
      SCHOOL_USERS_RESOURCE,
    );
    if (cached) return cached;

    return singleFlight(`tenant:${schoolId}:${SCHOOL_USERS_RESOURCE}`, async () => {
      const fresh = await loader();
      await safeSetTenant(
        schoolId,
        SCHOOL_USERS_RESOURCE,
        fresh,
        withTtlJitter(SCHOOL_DETAIL_TTL_SECONDS),
      );
      return fresh;
    });
  },

  // --- Global Users List ---
  async getOrLoadGlobalUsers(
    params: { q?: string; role?: string; status?: string } | undefined,
    loader: () => Promise<PlatformSchoolUserItem[]>,
  ): Promise<PlatformSchoolUserItem[]> {
    const ver = await readVersion(GLOBAL_VER_KEY);
    const sig = hashFilterParts([params?.q, params?.role, params?.status]);
    const cacheKey = `platform:global-users:v${ver}:${sig}`;
    const cached = await safeGetSystem<PlatformSchoolUserItem[]>(cacheKey);
    if (cached) return cached;

    return singleFlight(cacheKey, async () => {
      const fresh = await loader();
      await safeSetSystem(cacheKey, fresh, withTtlJitter(LIST_TTL_SECONDS));
      return fresh;
    });
  },

  // --- Invoices ---
  async getOrLoadInvoices(
    filters: { schoolId?: string; status?: string } | undefined,
    loader: () => Promise<PlatformInvoiceRecord[]>,
  ): Promise<PlatformInvoiceRecord[]> {
    const ver = await readVersion(GLOBAL_VER_KEY);
    const sig = hashFilterParts([filters?.schoolId, filters?.status]);
    const cacheKey = `platform:invoices:v${ver}:${sig}`;
    const cached = await safeGetSystem<PlatformInvoiceRecord[]>(cacheKey);
    if (cached) return cached;

    return singleFlight(cacheKey, async () => {
      const fresh = await loader();
      await safeSetSystem(cacheKey, fresh, withTtlJitter(LIST_TTL_SECONDS));
      return fresh;
    });
  },

  // --- Support Tickets ---
  async getOrLoadSupportTickets(
    status: string | undefined,
    loader: () => Promise<PlatformSupportTicketRecord[]>,
  ): Promise<PlatformSupportTicketRecord[]> {
    const ver = await readVersion(GLOBAL_VER_KEY);
    const sig = hashFilterParts([status]);
    const cacheKey = `platform:tickets:v${ver}:${sig}`;
    const cached = await safeGetSystem<PlatformSupportTicketRecord[]>(cacheKey);
    if (cached) return cached;

    return singleFlight(cacheKey, async () => {
      const fresh = await loader();
      await safeSetSystem(cacheKey, fresh, withTtlJitter(LIST_TTL_SECONDS));
      return fresh;
    });
  },

  // --- Audit Logs ---
  async getOrLoadAuditLogs(
    params: { schoolId?: string; q?: string } | undefined,
    loader: () => Promise<PlatformAuditLogRecord[]>,
  ): Promise<PlatformAuditLogRecord[]> {
    const ver = await readVersion(GLOBAL_VER_KEY);
    const sig = hashFilterParts([params?.schoolId, params?.q]);
    const cacheKey = `platform:audit:v${ver}:${sig}`;
    const cached = await safeGetSystem<PlatformAuditLogRecord[]>(cacheKey);
    if (cached) return cached;

    return singleFlight(cacheKey, async () => {
      const fresh = await loader();
      await safeSetSystem(cacheKey, fresh, withTtlJitter(AUDIT_TTL_SECONDS));
      return fresh;
    });
  },

  // --- Announcements ---
  async getOrLoadAnnouncements(
    loader: () => Promise<PlatformAnnouncementRecord[]>,
  ): Promise<PlatformAnnouncementRecord[]> {
    const ver = await readVersion(GLOBAL_VER_KEY);
    const cacheKey = `platform:announcements:v${ver}`;
    const cached = await safeGetSystem<PlatformAnnouncementRecord[]>(cacheKey);
    if (cached) return cached;

    return singleFlight(cacheKey, async () => {
      const fresh = await loader();
      await safeSetSystem(cacheKey, fresh, withTtlJitter(LIST_TTL_SECONDS));
      return fresh;
    });
  },

  // --- Health Snapshot ---
  async getOrLoadHealthSnapshot(
    loader: () => Promise<PlatformHealthSnapshot>,
  ): Promise<PlatformHealthSnapshot> {
    const cacheKey = "platform:health:latest";
    const cached = await safeGetSystem<PlatformHealthSnapshot>(cacheKey);
    if (cached) return cached;

    return singleFlight(cacheKey, async () => {
      const fresh = await loader();
      await safeSetSystem(cacheKey, fresh, HEALTH_TTL_SECONDS);
      return fresh;
    });
  },

  // --- Company Admins Team List ---
  async getOrLoadAdminsList(
    loader: () => Promise<PlatformAdminRecord[]>,
  ): Promise<PlatformAdminRecord[]> {
    const ver = await readVersion(ADMINS_VER_KEY);
    const cacheKey = `platform:admins:v${ver}`;
    const cached = await safeGetSystem<PlatformAdminRecord[]>(cacheKey);
    if (cached) return cached;

    return singleFlight(cacheKey, async () => {
      const fresh = await loader();
      await safeSetSystem(cacheKey, fresh, withTtlJitter(LIST_TTL_SECONDS));
      return fresh;
    });
  },

  // --- Platform Admin Session Auth Cache (avoids DB lookup on every SSR/API call) ---
  async getCachedAdminSession(
    tokenHash: string,
  ): Promise<{ admin: PlatformAdminRecord; mfaVerified: boolean } | null> {
    const cacheKey = `platform:session:${tokenHash}`;
    const cached = await safeGetSystem<CachedPlatformAdminSessionPayload>(cacheKey);
    if (!cached || !cached.admin?.id || cached.admin.status !== "ACTIVE") {
      return null;
    }
    const currentAdminVer = await readVersion(`platform:ver:admin:${cached.admin.id}`);
    if (cached.adminVersion !== currentAdminVer) {
      await systemCache.del(cacheKey).catch(() => {});
      return null;
    }
    return {
      admin: cached.admin,
      mfaVerified: cached.mfaVerified,
    };
  },

  async setCachedAdminSession(
    tokenHash: string,
    admin: PlatformAdminRecord,
    mfaVerified: boolean,
  ): Promise<void> {
    const adminVersion = await readVersion(`platform:ver:admin:${admin.id}`);
    await safeSetSystem<CachedPlatformAdminSessionPayload>(
      `platform:session:${tokenHash}`,
      { admin, mfaVerified, adminVersion },
      SESSION_TTL_SECONDS,
    );
  },

  async deleteCachedAdminSession(tokenHash: string): Promise<void> {
    await systemCache.del(`platform:session:${tokenHash}`).catch(() => {});
  },
};
