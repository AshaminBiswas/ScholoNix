import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionService, getSessionCookieName } from "@/server/auth/session-service";
import { schoolDashboardService } from "@/server/school/school-dashboard-service";
import { SchoolDashboard } from "@/modules/school/components/school-dashboard";

export const metadata: Metadata = {
  title: "School Dashboard | ScholoNix",
  description:
    "Real-time institutional management dashboard for registered schools: students, attendance, fee collection, admissions and academic performance.",
};

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams?: Promise<{
    schoolId?: string;
    demo?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;

  // Resolve search parameters
  const params = searchParams ? await searchParams : {};
  const requestedSchoolId = params.schoolId;

  const session = token ? await sessionService.verifyToken(token) : null;

  // If no session is found, enforce login requirement
  if (!session || !session.user) {
    // In local development/demo environment, allow previewing with registered school if explicitly requested via ?demo=true
    if (process.env.NODE_ENV !== "production" && params.demo === "true") {
      const demoSchoolId = requestedSchoolId || "sch_sunrise_001";
      const dashboardData = await schoolDashboardService.getDashboardData(demoSchoolId);
      const availableSchools = await schoolDashboardService.getAllSchools();

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
            id: "usr_demo",
            name: dashboardData.currentUser.name,
            email: "demo@scholonix.com",
            phone: "+919876543210",
            role: dashboardData.currentUser.role,
          }}
        />
      );
    }

    // Strict guard: Redirect unauthenticated requests to login
    redirect("/login?callbackUrl=/dashboard");
  }

  // Ensure user has a registered school associated
  const userSchoolId = requestedSchoolId || session.school?.id || session.user.schoolId;
  if (!userSchoolId) {
    redirect("/login?error=no_school");
  }

  // Fetch dynamic, school-specific dashboard data
  const dashboardData = await schoolDashboardService.getDashboardData(
    userSchoolId,
    session.user.id
  );

  const availableSchools = await schoolDashboardService.getAllSchools();

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
