import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { authRepository, SchoolRecord } from "@/server/auth/auth-repository";
import { sessionService, getSessionCookieName, SessionContext } from "@/server/auth/session-service";
import { isReservedSchoolSlug } from "@/modules/schools/services/registration-service";
import { logAuditEvent } from "@/server/security/audit-logger";

export type TenantRouteAccessResult =
  | {
      authorized: true;
      session: SessionContext;
      school: SchoolRecord;
    }
  | {
      authorized: false;
      reason: "TENANT_MISMATCH";
      ownSchool: SchoolRecord;
    };

/**
 * Resolves and authorizes a dynamic per-school route (`/{schoolSlug}/...`).
 * - Reserved platform routes -> 404
 * - Unauthenticated requests -> redirect to `/login?callbackUrl=...`
 * - Cross-tenant requests by non-platform users -> audited `TENANT_MISMATCH` denial (never exposes target school data)
 */
export async function resolveTenantRouteAccess(
  rawSchoolSlug: string,
  callbackPath: string,
): Promise<TenantRouteAccessResult> {
  const normalizedSlug = rawSchoolSlug.trim().toLowerCase();
  if (!normalizedSlug || isReservedSchoolSlug(normalizedSlug)) {
    notFound();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!token) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  const session = await sessionService.verifyToken(token);
  if (!session || !session.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  if (session.user.role !== "PLATFORM_SUPER_ADMIN") {
    const ownSchool =
      session.school ||
      (session.user.schoolId ? await authRepository.findSchoolById(session.user.schoolId) : null);

    if (!ownSchool) {
      redirect("/login?error=no_school");
    }

    if (ownSchool.slug.toLowerCase() !== normalizedSlug) {
      await logAuditEvent({
        schoolId: ownSchool.id,
        actorId: session.user.id,
        action: "TENANT_ACCESS_DENIED",
        entityType: "SchoolRoute",
        entityId: normalizedSlug,
        details: {
          requestedSlug: normalizedSlug,
          authorizedSlug: ownSchool.slug,
          callbackPath,
        },
      });

      return {
        authorized: false,
        reason: "TENANT_MISMATCH",
        ownSchool,
      };
    }

    return {
      authorized: true,
      session,
      school: ownSchool,
    };
  }

  const requestedSchool = await authRepository.findSchoolBySlug(normalizedSlug);
  if (!requestedSchool) {
    notFound();
  }

  return {
    authorized: true,
    session,
    school: requestedSchool,
  };
}
