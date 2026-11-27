import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { sessionService } from "@/server/auth/session-service";
import { logAuditEvent } from "@/server/security/audit-logger";
import type { PlatformAdminRoleValue } from "@/modules/platform/types";
import {
  isPlatformAdminFullyVerified,
  platformAdminAuthService,
} from "./platform-admin-auth";

export interface PlatformSessionActor {
  id: string;
  name: string;
  email: string | null;
  role: string;
  platformRole: PlatformAdminRoleValue;
  source: "platform_admins" | "legacy_user";
}

export type PlatformAdminGuardResult =
  | {
      authorized: true;
      session: { user: PlatformSessionActor };
      ipAddress?: string;
      userAgent?: string;
    }
  | {
      authorized: false;
      response: NextResponse;
    };

/**
 * Authorizes requests using the dedicated `platform_admins` session first,
 * enforcing mandatory initial password change + MFA/Passkey verification,
 * with fallback to legacy `User` (`PLATFORM_SUPER_ADMIN`) sessions.
 */
export async function requirePlatformSuperAdmin(
  req: NextRequest,
  resourceLabel = "platform",
  options?: { allowedRoles?: PlatformAdminRoleValue[] },
): Promise<PlatformAdminGuardResult> {
  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
  const userAgent = req.headers.get("user-agent") || undefined;

  // 1. Primary path: dedicated `platform_admins` + `platform_admin_sessions`
  const dedicatedSession = await platformAdminAuthService.getSessionFromRequest(req);
  if (dedicatedSession) {
    const dedicatedAdmin = dedicatedSession.admin;

    if (!isPlatformAdminFullyVerified(dedicatedAdmin, dedicatedSession.mfaVerified)) {
      await logAuditEvent({
        schoolId: "platform",
        actorId: dedicatedAdmin.id,
        action: "PLATFORM_ADMIN_SETUP_REQUIRED_BLOCK",
        entityType: "PlatformAdmin",
        entityId: resourceLabel,
        details: {
          mustChangePassword: dedicatedAdmin.mustChangePassword,
          emailVerified: Boolean(dedicatedAdmin.emailVerifiedAt),
          phoneVerified: Boolean(dedicatedAdmin.phoneVerifiedAt),
          mfaVerified: dedicatedSession.mfaVerified,
        },
        ipAddress,
        userAgent,
      });
      return {
        authorized: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: "ADMIN_SETUP_REQUIRED",
              message: dedicatedAdmin.mustChangePassword
                ? "Initial password change is required before accessing the Company Admin Panel."
                : !dedicatedAdmin.emailVerifiedAt || !dedicatedAdmin.phoneVerifiedAt
                  ? "Email and phone number verification are required before accessing the Company Admin Panel."
                  : "Two-Factor Authentication or Passkey verification is required.",
            },
          },
          { status: 403 },
        ),
      };
    }

    if (
      options?.allowedRoles &&
      !options.allowedRoles.includes(dedicatedAdmin.role)
    ) {
      await logAuditEvent({
        schoolId: "platform",
        actorId: dedicatedAdmin.id,
        action: "PLATFORM_ADMIN_ROLE_DENIED",
        entityType: "PlatformAdmin",
        entityId: resourceLabel,
        details: { role: dedicatedAdmin.role, allowedRoles: options.allowedRoles },
        ipAddress,
        userAgent,
      });
      return {
        authorized: false,
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: `Action requires one of: ${options.allowedRoles.join(", ")}.`,
            },
          },
          { status: 403 },
        ),
      };
    }

    return {
      authorized: true,
      session: {
        user: {
          id: dedicatedAdmin.id,
          name: dedicatedAdmin.name,
          email: dedicatedAdmin.email,
          role: "PLATFORM_SUPER_ADMIN",
          platformRole: dedicatedAdmin.role,
          source: "platform_admins",
        },
      },
      ipAddress,
      userAgent,
    };
  }

  // 2. Fallback path: legacy `User` session with role PLATFORM_SUPER_ADMIN
  const session = await sessionService.getSessionFromRequest(req);
  if (!session || !session.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHENTICATED", message: "Authentication required." },
        },
        { status: 401 },
      ),
    };
  }

  if (session.user.role !== "PLATFORM_SUPER_ADMIN" || session.user.status !== "ACTIVE") {
    await logAuditEvent({
      schoolId: session.user.schoolId || "system",
      actorId: session.user.id,
      action: "PLATFORM_ADMIN_ACCESS_DENIED",
      entityType: "PlatformAdmin",
      entityId: resourceLabel,
      details: {
        role: session.user.role,
        status: session.user.status,
        path: req.nextUrl.pathname,
      },
      ipAddress,
      userAgent,
    });

    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Forbidden: Company platform super-admin access required.",
          },
        },
        { status: 403 },
      ),
    };
  }

  return {
    authorized: true,
    session: {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: "PLATFORM_SUPER_ADMIN",
        platformRole: "SUPER_ADMIN",
        source: "legacy_user",
      },
    },
    ipAddress,
    userAgent,
  };
}
