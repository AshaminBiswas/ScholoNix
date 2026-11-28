import Link from "next/link";
import { DatabaseZap, ShieldAlert } from "lucide-react";
import { resolveTenantRouteAccess } from "@/server/school/resolve-tenant-route";
import { studentService } from "@/server/school/student-service";
import { hasPermission } from "@/server/authorization/permissions";
import { ServiceUnavailableError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { captureException } from "@/lib/observability/sentry";
import { buildSchoolRoute, buildSchoolShellProps } from "@/modules/school/utils/shell-props";
import { SchoolWorkspaceShell } from "@/modules/school/components/school-workspace-shell";
import { TenantUnauthorizedView } from "@/modules/school/components/tenant-unauthorized-view";
import { TenantServiceUnavailableView } from "@/modules/school/components/tenant-service-unavailable-view";
import { SchoolStudentWorkspaceClient } from "@/modules/students/components/school-student-workspace-client";
import type { StudentNavSection } from "@/modules/students/types";

export async function renderSchoolStudentWorkspacePage({
  schoolSlug,
  section,
  studentId = null,
}: {
  schoolSlug: string;
  section: StudentNavSection;
  studentId?: string | null;
}) {
  const subPath =
    section === "dashboard"
      ? "students"
      : section === "profile" && studentId
        ? `students/profile/${studentId}`
        : `students/${section}`;

  const access = await resolveTenantRouteAccess(
    schoolSlug,
    `/${schoolSlug}/${subPath}`,
  );

  if (!access.authorized) {
    if (access.reason === "SERVICE_UNAVAILABLE") {
      return (
        <TenantServiceUnavailableView
          schoolSlug={schoolSlug}
          message={access.message}
        />
      );
    }
    return (
      <TenantUnauthorizedView
        ownSchoolSlug={access.ownSchool.slug}
        ownSchoolName={access.ownSchool.name}
      />
    );
  }

  const { school, user } = buildSchoolShellProps(access.school, access.session.user);
  const permActor = {
    id: access.session.user.id,
    role: access.session.user.role,
    schoolId: access.school.id,
  };

  if (!hasPermission(permActor, "students:read")) {
    return (
      <SchoolWorkspaceShell
        school={school}
        user={user}
        activeNav="students"
        activeStudentSection={section}
      >
        <div className="mx-auto max-w-lg rounded-[22px] border border-rose-200 bg-white p-8 text-center shadow-xs space-y-3 dark:border-rose-800/70 dark:bg-[#141731]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Students Access Restricted
          </h1>
          <p className="text-xs text-[#4D5072] leading-relaxed dark:text-[#9DA6CC]">
            Your current role ({user.displayRole}) does not have permission to view student
            records for {school.name}.
          </p>
          <Link
            href={buildSchoolRoute(school.slug)}
            className="inline-flex items-center justify-center rounded-[12px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4F27E8]"
          >
            Back to Dashboard
          </Link>
        </div>
      </SchoolWorkspaceShell>
    );
  }

  try {
    const data = await studentService.getDashboardData({
      userId: access.session.user.id,
      userName: access.session.user.name,
      role: access.session.user.role,
      schoolId: access.school.id,
      schoolSlug: access.school.slug,
      schoolName: access.school.name,
    });

    return (
      <SchoolWorkspaceShell
        school={school}
        user={user}
        activeNav="students"
        activeStudentSection={section}
      >
        <SchoolStudentWorkspaceClient
          schoolId={access.school.id}
          schoolSlug={access.school.slug}
          initialSnapshot={data.snapshot}
          initialAnalytics={data.analytics}
          initialSection={section}
          initialStudentId={studentId}
          permissions={{
            canCreate: hasPermission(permActor, "students:write"),
            canEdit: hasPermission(permActor, "students:write"),
            canPromote: hasPermission(permActor, "students:promote"),
            canTransfer: hasPermission(permActor, "students:transfer"),
            canExport: hasPermission(permActor, "students:export"),
            canManageSettings: hasPermission(permActor, "students:settings"),
          }}
        />
      </SchoolWorkspaceShell>
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Students service unavailable.";
    logger.error(
      { schoolId: access.school.id, error: message },
      "[renderSchoolStudentWorkspacePage] Failed to load student workspace",
    );
    captureException(err, {
      schoolId: access.school.id,
      userId: access.session.user.id,
      tags: { area: "renderSchoolStudentWorkspacePage" },
    });

    return (
      <SchoolWorkspaceShell
        school={school}
        user={user}
        activeNav="students"
        activeStudentSection={section}
      >
        <div className="mx-auto max-w-lg rounded-[22px] border border-amber-200 bg-white p-8 text-center shadow-xs space-y-3 dark:border-amber-800/70 dark:bg-[#141731]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <DatabaseZap className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Unable to Load Students
          </h1>
          <p className="text-xs text-[#4D5072] leading-relaxed dark:text-[#9DA6CC]">
            {err instanceof ServiceUnavailableError ? err.message : message}
          </p>
        </div>
      </SchoolWorkspaceShell>
    );
  }
}
