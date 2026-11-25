import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionService, getSessionCookieName } from "@/server/auth/session-service";
import { schoolDashboardService } from "@/server/school/school-dashboard-service";
import { authRepository } from "@/server/auth/auth-repository";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!token) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const session = await sessionService.verifyToken(token);
  if (!session || !session.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const ownSchool =
    session.school ||
    (session.user.schoolId ? await authRepository.findSchoolById(session.user.schoolId) : null);

  if (ownSchool?.slug) {
    redirect(`/${ownSchool.slug}`);
  }

  if (session.user.role === "PLATFORM_SUPER_ADMIN") {
    const schools = await schoolDashboardService.getSchoolsForUser(session.user, session.school);
    if (schools[0]?.slug) {
      redirect(`/${schools[0].slug}`);
    }
  }

  redirect("/login?error=no_school");
}
