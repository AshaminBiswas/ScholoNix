import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { authRepository } from "@/server/auth/auth-repository";
import { getSessionCookieName, sessionService } from "@/server/auth/session-service";
import { isReservedSchoolSlug } from "@/modules/schools/services/registration-service";
import { SchoolLoginPage } from "@/modules/authentication/components/school-login-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Authorized School Portal Sign-In | ScholoNix",
  robots: { index: false, follow: false },
};

interface SchoolUniqueLoginPageProps {
  params: Promise<{ schoolSlug: string }>;
}

export default async function SchoolUniqueLoginPage({ params }: SchoolUniqueLoginPageProps) {
  const { schoolSlug } = await params;
  const normalizedSlug = schoolSlug.trim().toLowerCase();

  if (!normalizedSlug || isReservedSchoolSlug(normalizedSlug)) {
    notFound();
  }

  const school = await authRepository.findSchoolBySlug(normalizedSlug);
  if (!school) {
    notFound();
  }

  // If the visitor already holds an active session authorized for this school, go straight to workspace
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (token) {
    try {
      const session = await sessionService.verifyToken(token);
      if (
        session?.user &&
        (session.user.role === "PLATFORM_SUPER_ADMIN" || session.user.schoolId === school.id)
      ) {
        redirect(`/${school.slug}`);
      }
    } catch {
      // Allow rendering the login page if session lookup fails transiently
    }
  }

  return <SchoolLoginPage lockedSchoolSlug={school.slug} />;
}
