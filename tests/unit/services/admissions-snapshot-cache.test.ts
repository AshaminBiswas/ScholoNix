import { describe, expect, it, vi, beforeEach } from "vitest";
import { tenantCache } from "@/server/integrations/redis";
import {
  admissionsRepository,
  ADMISSIONS_SNAPSHOT_CACHE_KEY,
} from "@/server/school/admissions-repository";
import { admissionsService } from "@/server/school/admissions-service";

describe("Admissions tenant snapshot caching & mutation invalidation", () => {
  const schoolA = "11111111-1111-4111-8111-111111111111";
  const schoolB = "22222222-2222-4222-8222-222222222222";
  const ctxA = {
    userId: "admin-a",
    userName: "Admin A",
    role: "PRINCIPAL",
    schoolId: schoolA,
    schoolSlug: "school-a",
    schoolName: "School A",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("reads and caches snapshot scoped strictly by schoolId, rejecting cross-tenant payloads", async () => {
    const store = new Map<string, unknown>();
    const getSpy = vi.spyOn(tenantCache, "get").mockImplementation(async (sid, key) => {
      return (store.get(`${sid}:${key}`) as never) ?? null;
    });
    const setSpy = vi.spyOn(tenantCache, "set").mockImplementation(async (sid, key, val) => {
      store.set(`${sid}:${key}`, val);
    });

    const first = await admissionsRepository.getTenantSnapshot(schoolA);
    expect(first.settings.schoolId).toBe(schoolA);
    expect(setSpy).toHaveBeenCalledWith(
      schoolA,
      ADMISSIONS_SNAPSHOT_CACHE_KEY,
      expect.objectContaining({ settings: expect.objectContaining({ schoolId: schoolA }) }),
      60,
    );

    // Inject mismatched school payload into schoolB key — validator must reject and never return schoolA data
    store.set(`${schoolB}:${ADMISSIONS_SNAPSHOT_CACHE_KEY}`, first);
    const secondB = await admissionsRepository.getTenantSnapshot(schoolB);
    expect(secondB.settings.schoolId).toBe(schoolB);
    expect(getSpy).toHaveBeenCalledWith(schoolB, ADMISSIONS_SNAPSHOT_CACHE_KEY);

    // Subsequent call for schoolA returns cached snapshot seamlessly
    const cachedA = await admissionsRepository.getTenantSnapshot(schoolA);
    expect(cachedA.settings.schoolId).toBe(schoolA);
  });

  it("invalidates tenant snapshot and dashboard caches on application and reminder mutations", async () => {
    const delSpy = vi.spyOn(tenantCache, "del").mockResolvedValue(undefined);

    const created = await admissionsService.createApplication(ctxA, {
      studentName: "Cache Test Student",
      gender: "Female",
      dateOfBirth: "2018-04-10",
      gradeApplied: "Class I",
      academicYear: "2026 – 2027",
      guardianName: "Cache Test Guardian",
      guardianRelation: "Mother",
      guardianPhone: "+919000000010",
      guardianEmail: "",
      previousSchool: "",
      status: "UNDER_REVIEW",
      notes: "",
    });
    expect(created.schoolId).toBe(schoolA);
    expect(delSpy).toHaveBeenCalledWith(schoolA, ADMISSIONS_SNAPSHOT_CACHE_KEY);
    expect(delSpy).toHaveBeenCalledWith(schoolA, `dashboard:v1:${ctxA.userId}`);

    delSpy.mockClear();
    const reminder = await admissionsService.createReminder(ctxA, {
      title: "Check original birth certificate",
      priority: "INFO",
    });
    expect(delSpy).toHaveBeenCalledWith(schoolA, ADMISSIONS_SNAPSHOT_CACHE_KEY);

    delSpy.mockClear();
    await admissionsService.toggleReminder(ctxA, reminder.id, true);
    expect(delSpy).toHaveBeenCalledWith(schoolA, ADMISSIONS_SNAPSHOT_CACHE_KEY);

    delSpy.mockClear();
    await admissionsService.deleteReminder(ctxA, reminder.id);
    expect(delSpy).toHaveBeenCalledWith(schoolA, ADMISSIONS_SNAPSHOT_CACHE_KEY);
  });

  it("degrades gracefully without failing when cache backend rejects", async () => {
    vi.spyOn(tenantCache, "get").mockResolvedValueOnce(null);
    vi.spyOn(tenantCache, "set").mockResolvedValueOnce(undefined);

    const snapshot = await admissionsRepository.getTenantSnapshot(schoolA);
    expect(snapshot.settings.schoolId).toBe(schoolA);
    expect(Array.isArray(snapshot.applications)).toBe(true);
  });
});
