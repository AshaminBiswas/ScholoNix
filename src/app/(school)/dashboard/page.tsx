import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionService, getSessionCookieName } from "@/server/auth/session-service";
import { schoolDashboardService } from "@/server/school/school-dashboard-service";
import { SchoolDashboard } from "@/modules/school/components/school-dashboard";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams?: Promise<{ schoolId?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;

  const session = token ? await sessionService.verifyToken(token) : null;
  if (!session || !session.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const params = searchParams ? await searchParams : {};
  const requestedSchoolId = params.schoolId?.trim();
  const ownSchoolId = session.school?.id || session.user.schoolId;

  if (!ownSchoolId && session.user.role !== "PLATFORM_SUPER_ADMIN") {
    redirect("/login?error=no_school");
  }

  // Enforce tenant boundary: regular users can only access their own school
  if (
    requestedSchoolId &&
    session.user.role !== "PLATFORM_SUPER_ADMIN" &&
    requestedSchoolId !== ownSchoolId
  ) {
    redirect("/dashboard");
  }

  const targetSchoolId = requestedSchoolId || ownSchoolId;
  if (!targetSchoolId) {
    redirect("/login?error=no_school");
  }

  let dashboardData;
  let availableSchools;
  try {
    [dashboardData, availableSchools] = await Promise.all([
      schoolDashboardService.getDashboardData(targetSchoolId, session.user.id),
      schoolDashboardService.getSchoolsForUser(session.user, session.school),
    ]);
  } catch {
    redirect("/login?error=no_school");
  }

  return (
    <SchoolDashboard
      initialData={dashboardData}
      availableSchools={availableSchools.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        code: s.code,
        city: s.city,
        state: s.state,
      }))}
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        phone: session.user.phone,
        role: session.user.role,
      }}
    />
  );
}
