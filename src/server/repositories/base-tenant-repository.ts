import "server-only";
import { getTenantContext } from "@/server/tenant/tenant-context";

/**
 * Base abstract repository class for tenant-scoped database entities.
 * Automatically resolves and binds the verified schoolId from the active tenant context.
 */
export abstract class BaseTenantRepository {
  /**
   * Resolves the verified tenant schoolId for the current execution context.
   */
  protected getSchoolId(explicitSchoolId?: string): string {
    if (explicitSchoolId && explicitSchoolId.trim() !== "") {
      return explicitSchoolId;
    }
    const context = getTenantContext();
    return context.schoolId;
  }

  /**
   * Enriches query parameters with the active school tenant filter.
   */
  protected withTenantScope<T extends Record<string, unknown>>(
    filter: T,
    explicitSchoolId?: string,
  ): T & { schoolId: string } {
    return {
      ...filter,
      schoolId: this.getSchoolId(explicitSchoolId),
    };
  }
}
