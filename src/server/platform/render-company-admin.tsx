import "server-only";
import React from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getSessionCookieName, sessionService } from "@/server/auth/session-service";
import { platformService } from "@/server/platform/platform-service";
import { CompanyAdminPanel } from "@/modules/platform/components/company-admin-panel";
import { PlatformAdminLoginView } from "@/modules/platform/components/platform-admin-login-view";
import { PlatformAdminSecurityGate } from "@/modules/platform/components/platform-admin-security-gate";
import { logAuditEvent } from "@/server/security/audit-logger";
import { getConfiguredPlatformAdminSlug } from "./admin-route-config";
import { parsePlatformSubSegments } from "@/modules/platform/routing";
import {
  getPlatformAdminCookieName,
  isPlatformAdminFullyVerified,
  platformAdminAuthService,
} from "./platform-admin-auth";

/**
 * Shared SSR loader and stealth security gate for the Company Admin Panel.
 * - Authenticates dedicated `platform_admins` session cookie FIRST, with legacy `User.PLATFORM_SUPER_ADMIN` fallback.
 * - When `PLATFORM_ADMIN_SLUG` is set, `/admin` always returns HTTP 404.
 * - On the active secret URL (`/{PLATFORM_ADMIN_SLUG}` or `/admin` in development), unauthenticated visitors see the dedicated `PlatformAdminLoginView`.
 * - In production without `PLATFORM_ADMIN_SLUG`, `/admin` returns 404 to unauthenticated visitors.
 * - Authenticated non-company school users always trigger an audit event and HTTP 404.
 */
export async function renderCompanyAdminPage(
  routeSlug: string,
  subSegments: string[] = [],
): Promise<React.ReactElement> {
  const configuredSlug = getConfiguredPlatformAdminSlug();
  if (configuredSlug && routeSlug.toLowerCase() !== configuredSlug) {
    notFound();
  }
  if (!configuredSlug && routeSlug.toLowerCase() !== "admin") {
    notFound();
  }

  const basePath = `/${routeSlug}`;
  const cleanSubPath = subSegments.filter(Boolean).join("/");
  const targetPath = cleanSubPath ? `${basePath}/${cleanSubPath}` : basePath;
  const initialRoute = parsePlatformSubSegments(subSegments);

  const cookieStore = await cookies();

  // 1. Check dedicated `platform_admins` session cookie
  const platformToken = cookieStore.get(getPlatformAdminCookieName())?.value;
  const platformSession = platformToken
    ? await platformAdminAuthService.verifySessionToken(platformToken)
    : null;

  if (platformSession) {
    const { admin: platformAdmin, mfaVerified } = platformSession;

    if (!isPlatformAdminFullyVerified(platformAdmin, mfaVerified)) {
      return (
        <PlatformAdminSecurityGate
          admin={{
            id: platformAdmin.id,
            name: platformAdmin.name,
            email: platformAdmin.email,
            phone: platformAdmin.phone,
            role: platformAdmin.role,
            mustChangePassword: platformAdmin.mustChangePassword,
            emailVerifiedAt: platformAdmin.emailVerifiedAt,
            phoneVerifiedAt: platformAdmin.phoneVerifiedAt,
            twoFactorEnabled: platformAdmin.twoFactorEnabled,
            passkeyCount: platformAdmin.passkeyCount ?? 0,
          }}
          mfaVerified={mfaVerified}
          targetPath={targetPath}
        />
      );
    }

    const { overview: initialOverview, schools: initialSchools } =
      typeof platformService.getOverviewWithSchools === "function"
        ? await platformService.getOverviewWithSchools()
        : {
            overview: await platformService.getOverview(),
            schools: await platformService.listSchools(),
          };
    return (
      <CompanyAdminPanel
        adminUser={{
          id: platformAdmin.id,
          name: platformAdmin.name,
          email: platformAdmin.email,
          platformRole: platformAdmin.role,
          twoFactorEnabled: platformAdmin.twoFactorEnabled,
          passkeyCount: platformAdmin.passkeyCount ?? 0,
        }}
        initialOverview={initialOverview}
        initialSchools={initialSchools}
        adminBasePath={basePath}
        initialRoute={initialRoute}
      />
    );
  }

  // 2. Check legacy `User` session (blocks ordinary school users with stealth 404)
  const legacyToken = cookieStore.get(getSessionCookieName())?.value;
  if (legacyToken) {
    let legacySession = null;
    try {
      legacySession = await sessionService.verifyToken(legacyToken);
    } catch {
      legacySession = null;
    }

    if (legacySession?.user) {
      if (
        legacySession.user.role === "PLATFORM_SUPER_ADMIN" &&
        legacySession.user.status === "ACTIVE"
      ) {
        const [initialOverview, initialSchools] = await Promise.all([
          platformService.getOverview(),
          platformService.listSchools(),
        ]);
        return (
          <CompanyAdminPanel
            adminUser={{
              id: legacySession.user.id,
              name: legacySession.user.name,
              email: legacySession.user.email,
              platformRole: "SUPER_ADMIN",
            }}
            initialOverview={initialOverview}
            initialSchools={initialSchools}
            adminBasePath={basePath}
            initialRoute={initialRoute}
          />
        );
      }

      await logAuditEvent({
        schoolId: legacySession.user.schoolId || "system",
        actorId: legacySession.user.id,
        action: "PLATFORM_ADMIN_ACCESS_DENIED",
        entityType: "PlatformAdminPage",
        entityId: routeSlug,
        details: { role: legacySession.user.role, status: legacySession.user.status },
      });
      notFound();
    }
  }

  // 3. Unauthenticated visitor:
  // If on configured secret slug (or local dev `/admin`), render dedicated Company Admin Login UI;
  // otherwise keep `/admin` stealth 404 in production.
  const canShowDedicatedLogin =
    Boolean(configuredSlug && routeSlug.toLowerCase() === configuredSlug) ||
    process.env.NODE_ENV === "development";

  if (!canShowDedicatedLogin) {
    notFound();
  }

  return <PlatformAdminLoginView targetPath={targetPath} />;
}
