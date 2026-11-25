import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { authRepository, SchoolRecord } from "@/server/auth/auth-repository";
import { sessionService, getSessionCookieName, SessionContext } from "@/server/auth/session-service";
import { isReservedSchoolSlug } from "@/modules/schools/services/registration-service";
import { ServiceUnavailableError } from "@/lib/errors";
import { captureException } from "@/lib/observability/sentry";
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
    }
  | {
      authorized: false;
      reason: "SERVICE_UNAVAILABLE";
      message: string;
    };

/**
 * Resolves and authorizes a dynamic per-school route (`/{schoolSlug}/...`).
 * - Reserved platform routes -> 404
 * - Unauthenticated requests -> redirect to `/login?callbackUrl=...`
 * - Cross-tenant requests by non-platform users -> audited `TENANT_MISMATCH` denial (never exposes target school data)
 * - Transient auth/DB outages -> non-throwing `SERVICE_UNAVAILABLE` status so Server Components degrade cleanly
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

  let session: SessionContext | null;
  try {
    session = await sessionService.verifyToken(token);
  } catch (err: unknown) {
    captureException(err, {
      tags: { area: "resolveTenantRouteAccess.verifyToken", schoolSlug: normalizedSlug },
    });
    return {
      authorized: false,
      reason: "SERVICE_UNAVAILABLE",
      message:
        err instanceof ServiceUnavailableError
          ? err.message
          : "Authentication service is temporarily unavailable. Please try again in a moment.",
    };
  }

  if (!session || !session.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  if (session.user.role !== "PLATFORM_SUPER_ADMIN") {
    let ownSchool: SchoolRecord | null = session.school;
    if (!ownSchool && session.user.schoolId) {
      try {
        ownSchool = await authRepository.findSchoolById(session.user.schoolId);
      } catch (err: unknown) {
        captureException(err, {
          userId: session.user.id,
          schoolId: session.user.schoolId,
          tags: { area: "resolveTenantRouteAccess.findSchoolById", schoolSlug: normalizedSlug },
        });
        return {
          authorized: false,
          reason: "SERVICE_UNAVAILABLE",
          message:
            err instanceof ServiceUnavailableError
              ? err.message
              : "School directory is temporarily unavailable. Please try again in a moment.",
        };
      }
    }

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

  let requestedSchool: SchoolRecord | null;
  try {
    requestedSchool = await authRepository.findSchoolBySlug(normalizedSlug);
  } catch (err: unknown) {
    captureException(err, {
      userId: session.user.id,
      tags: { area: "resolveTenantRouteAccess.findSchoolBySlug", schoolSlug: normalizedSlug },
    });
    return {
      authorized: false,
      reason: "SERVICE_UNAVAILABLE",
      message:
        err instanceof ServiceUnavailableError
          ? err.message
          : "School directory is temporarily unavailable. Please try again in a moment.",
    };
  }

  if (!requestedSchool) {
    notFound();
  }

  return {
    authorized: true,
    session,
    school: requestedSchool,
  };
}
