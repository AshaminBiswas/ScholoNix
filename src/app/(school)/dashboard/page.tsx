import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionService, getSessionCookieName, SessionContext } from "@/server/auth/session-service";
import { schoolDashboardService } from "@/server/school/school-dashboard-service";
import { authRepository, SchoolRecord } from "@/server/auth/auth-repository";
import { TenantServiceUnavailableView } from "@/modules/school/components/tenant-service-unavailable-view";
import { ServiceUnavailableError } from "@/lib/errors";
import { captureException } from "@/lib/observability/sentry";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!token) {
    redirect("/login?callbackUrl=/dashboard");
  }

  let session: SessionContext | null;
  try {
    session = await sessionService.verifyToken(token);
  } catch (err: unknown) {
    captureException(err, { tags: { area: "DashboardPage.verifyToken" } });
    return (
      <TenantServiceUnavailableView
        message={
          err instanceof ServiceUnavailableError
            ? err.message
            : "Authentication service is temporarily unavailable. Please try again in a moment."
        }
      />
    );
  }

  if (!session || !session.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  let ownSchool: SchoolRecord | null = session.school;
  if (!ownSchool && session.user.schoolId) {
    try {
      ownSchool = await authRepository.findSchoolById(session.user.schoolId);
    } catch (err: unknown) {
      captureException(err, {
        userId: session.user.id,
        schoolId: session.user.schoolId,
        tags: { area: "DashboardPage.findSchoolById" },
      });
      return (
        <TenantServiceUnavailableView
          message={
            err instanceof ServiceUnavailableError
              ? err.message
              : "School directory is temporarily unavailable. Please try again in a moment."
          }
        />
      );
    }
  }

  if (ownSchool?.slug) {
    redirect(`/${ownSchool.slug}`);
  }

  if (session.user.role === "PLATFORM_SUPER_ADMIN") {
    let schools: SchoolRecord[] = [];
    try {
      schools = await schoolDashboardService.getSchoolsForUser(session.user, session.school);
    } catch (err: unknown) {
      captureException(err, {
        userId: session.user.id,
        tags: { area: "DashboardPage.getSchoolsForUser" },
      });
      return (
        <TenantServiceUnavailableView
          message={
            err instanceof ServiceUnavailableError
              ? err.message
              : "Unable to load school directory right now. Please try again in a moment."
          }
        />
      );
    }
    if (schools[0]?.slug) {
      redirect(`/${schools[0].slug}`);
    }
  }

  redirect("/login?error=no_school");
}
