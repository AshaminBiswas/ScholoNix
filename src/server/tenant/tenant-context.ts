import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { TenantNotFoundError } from "@/lib/errors";

export interface TenantContext {
  schoolId: string;
  slug: string;
  name: string;
}

const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Executes a callback within a verified school tenant context.
 */
export function runWithTenantContext<T>(
  context: TenantContext,
  fn: () => Promise<T> | T,
): Promise<T> | T {
  return tenantStorage.run(context, fn);
}

/**
 * Retrieves the currently active tenant context.
 * Throws TenantNotFoundError if executed outside an established tenant boundary.
 */
export function getTenantContext(): TenantContext {
  const ctx = tenantStorage.getStore();
  if (!ctx || !ctx.schoolId) {
    throw new TenantNotFoundError("Active school tenant context is missing");
  }
  return ctx;
}

/**
 * Safely checks if a tenant context is currently active without throwing.
 */
export function hasTenantContext(): boolean {
  const ctx = tenantStorage.getStore();
  return Boolean(ctx && ctx.schoolId);
}
