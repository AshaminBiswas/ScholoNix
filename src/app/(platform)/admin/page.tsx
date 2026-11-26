import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { authRepository } from "@/server/auth/auth-repository";
import { getSessionCookieName, sessionService, type SessionContext } from "@/server/auth/session-service";
import { CompanyAdminPanel } from "@/modules/platform/components/company-admin-panel";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Company Admin Panel | ScholoNix",
  robots: { index: false, follow: false },
};

export default async function CompanyAdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!token) {
    redirect("/login?callbackUrl=/admin");
  }

  let session: SessionContext | null = null;
  try {
    session = await sessionService.verifyToken(token);
  } catch {
    session = null;
  }

  if (!session || !session.user) {
    redirect("/login?callbackUrl=/admin");
  }

  if (session.user.role !== "PLATFORM_SUPER_ADMIN") {
    const backHref = (session.school?.slug ? `/${session.school.slug}` : "/dashboard") as Route;
    return (
      <div className="relative min-h-screen bg-[#F4F6FC] flex items-center justify-center p-4 dark:bg-[#090B1A]">
        <div className="fixed right-4 top-4 z-50">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md rounded-[24px] border border-[#D6DBF0] bg-white p-7 text-center shadow-xl dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/60 dark:bg-red-950/60 dark:text-red-400 dark:ring-red-950/30">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Platform Admin Access Restricted
          </h1>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#4D5072] dark:text-[#9DA6CC]">
            The Company Admin Panel is restricted to authorized ScholoNix platform administrators.
          </p>
          <Link
            href={backHref}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#663CF6] to-[#4F27E8] px-5 py-3 text-sm font-bold text-white shadow-md hover:opacity-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Workspace</span>
          </Link>
        </div>
      </div>
    );
  }

  const rawSchools = await authRepository.searchSchoolsForAdmin();
  const initialSchools = rawSchools.map((entry) => ({
    school: {
      id: entry.school.id,
      name: entry.school.name,
      slug: entry.school.slug,
      uniqueId: entry.school.uniqueId ?? null,
      code: entry.school.code,
      category: entry.school.category ?? null,
      affiliationBoard: entry.school.affiliationBoard ?? null,
      contactPhone: entry.school.contactPhone ?? null,
      contactEmail: entry.school.contactEmail ?? null,
      website: entry.school.website ?? null,
      addressLine: entry.school.addressLine ?? null,
      city: entry.school.city ?? null,
      state: entry.school.state ?? null,
      pinCode: entry.school.pinCode ?? null,
      country: entry.school.country,
      status: entry.school.status,
      plan: entry.school.plan ?? null,
      createdAt:
        entry.school.createdAt instanceof Date
          ? entry.school.createdAt.toISOString()
          : String(entry.school.createdAt),
    },
    users: entry.users.map((u) => ({
      ...u,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
    })),
    counts: entry.counts,
  }));

  return (
    <CompanyAdminPanel
      adminUser={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      }}
      initialSchools={initialSchools}
    />
  );
}
