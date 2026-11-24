import { describe, expect, it } from "vitest";
import {
  runWithTenantContext,
  getTenantContext,
  hasTenantContext,
} from "@/server/tenant/tenant-context";
import {
  authorize,
  hasPermission,
  type AuthUser,
} from "@/server/authorization/permissions";
import { BaseTenantRepository } from "@/server/repositories/base-tenant-repository";
import { TenantNotFoundError, AuthorizationError } from "@/lib/errors";
import { MOCK_TENANT_A, MOCK_TENANT_B } from "../fixtures/tenant-fixture";

class MockStudentRepository extends BaseTenantRepository {
  public findStudents(filter: { grade?: string }, explicitSchoolId?: string) {
    return this.withTenantScope(filter, explicitSchoolId);
  }
}

describe("Tenant Isolation & Security Controls", () => {
  it("enforces tenant context boundary and throws when uninitialized", () => {
    expect(hasTenantContext()).toBe(false);
    expect(() => getTenantContext()).toThrow(TenantNotFoundError);
  });

  it("resolves the correct tenant within runWithTenantContext", async () => {
    await runWithTenantContext(MOCK_TENANT_A, async () => {
      expect(hasTenantContext()).toBe(true);
      const ctx = getTenantContext();
      expect(ctx.schoolId).toBe(MOCK_TENANT_A.schoolId);
      expect(ctx.slug).toBe(MOCK_TENANT_A.slug);
    });

    // After context completes, context resets
    expect(hasTenantContext()).toBe(false);
  });

  it("automatically scopes repository queries with active tenant schoolId", async () => {
    const repo = new MockStudentRepository();

    await runWithTenantContext(MOCK_TENANT_A, async () => {
      const query = repo.findStudents({ grade: "10" });
      expect(query.schoolId).toBe(MOCK_TENANT_A.schoolId);
      expect(query.grade).toBe("10");
    });

    await runWithTenantContext(MOCK_TENANT_B, async () => {
      const query = repo.findStudents({ grade: "10" });
      expect(query.schoolId).toBe(MOCK_TENANT_B.schoolId);
    });
  });

  it("enforces RBAC permissions correctly", () => {
    const teacherUser: AuthUser = {
      id: "teacher-1",
      role: "TEACHER",
      schoolId: MOCK_TENANT_A.schoolId,
    };

    const studentUser: AuthUser = {
      id: "student-1",
      role: "STUDENT",
      schoolId: MOCK_TENANT_A.schoolId,
    };

    // Teacher can mark attendance, student cannot
    expect(hasPermission(teacherUser, "attendance:write")).toBe(true);
    expect(hasPermission(studentUser, "attendance:write")).toBe(false);

    // Student attempting teacher action must throw AuthorizationError
    expect(() => authorize(studentUser, "attendance:write")).toThrow(AuthorizationError);
  });
});
