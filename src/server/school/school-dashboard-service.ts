import "server-only";
import { authRepository, SchoolRecord, UserRecord } from "@/server/auth/auth-repository";
import { tenantCache } from "@/server/integrations/redis";
import { TenantMismatchError, TenantNotFoundError } from "@/lib/errors";
import { formatAvatarInitials, formatRoleLabel } from "@/modules/school/utils/shell-props";
import type { SchoolDashboardData } from "@/modules/school/types";

function getCurrentAcademicSession(): SchoolDashboardData["academicSession"] {
  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(now);

  // Extract calendar date in Asia/Kolkata so session calculation is timezone-consistent
  const istParts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Kolkata",
  }).formatToParts(now);

  const yearNum = Number(istParts.find((p) => p.type === "year")?.value || now.getFullYear());
  const monthNum = Number(istParts.find((p) => p.type === "month")?.value || now.getMonth() + 1);
  const dayNum = Number(istParts.find((p) => p.type === "day")?.value || now.getDate());

  const startYear = monthNum >= 4 ? yearNum : yearNum - 1;
  const endYear = startYear + 1;
  const term = monthNum >= 4 && monthNum <= 9 ? "Term 1" : "Term 2";

  const todayUtc = Date.UTC(yearNum, monthNum - 1, dayNum);
  const sessionEndUtc = Date.UTC(endYear, 2, 31); // March 31 of academic end year
  const daysLeft = Math.max(0, Math.ceil((sessionEndUtc - todayUtc) / (1000 * 60 * 60 * 24)));

  return {
    currentDate: formattedDate,
    year: `${startYear} – ${endYear}`,
    term,
    workingDaysLeft: daysLeft,
  };
}

const DASHBOARD_CACHE_TTL_SECONDS = 60;

function buildEmptyDashboardData(
  school: SchoolRecord,
  user?: Pick<UserRecord, "name" | "role"> | null,
): SchoolDashboardData {
  const userName = user?.name?.trim() || "School Administrator";
  const userRole = user?.role ? formatRoleLabel(user.role) : "School Admin";

  return {
    school: {
      id: school.id,
      name: school.name,
      slug: school.slug,
      code: school.code || "",
      affiliationBoard: school.affiliationBoard || "Not Specified",
      city: school.city || "",
      state: school.state || "",
    },
    currentUser: {
      name: userName,
      role: userRole,
      avatarInitials: formatAvatarInitials(userName),
    },
    academicSession: getCurrentAcademicSession(),
    kpis: {
      totalStudents: { value: 0, change: 0 },
      totalStaff: { value: 0, change: 0 },
      pendingAdmissions: { value: 0, change: 0 },
      feeDues: { value: 0, change: 0 },
    },
    studentOverview: {
      total: 0,
      sections: [],
    },
    attendanceToday: {
      rate: 0,
      present: 0,
      absent: 0,
      notMarked: 0,
    },
    todayTasks: [],
    feeCollection: {
      collectedAmount: 0,
      collectionRate: 0,
      totalFee: 0,
      pendingFee: 0,
      overdueFee: 0,
      monthlyTrends: [],
    },
    upcomingEvents: [],
    recentAdmissions: [],
    recentActivities: [],
    classStrength: [],
    academicPerformance: {
      overallPassRate: 0,
      trendVsLastTerm: 0,
      termTrends: [],
      topClasses: [],
    },
    admissionFunnel: {
      enquiries: 0,
      applications: 0,
      shortlisted: 0,
      admitted: 0,
      conversionRate: 0,
      trendVsLastYear: 0,
    },
    staffOverview: {
      total: 0,
      teaching: 0,
      teachingPercentage: 0,
      nonTeaching: 0,
      nonTeachingPercentage: 0,
      administrative: 0,
      adminPercentage: 0,
    },
    genderBreakdown: {
      total: 0,
      boys: 0,
      boysPercentage: 0,
      girls: 0,
      girlsPercentage: 0,
    },
    keyInsights: [],
    notices: [],
    communicationSummary: {
      noticesSent: 0,
      smsDelivered: 0,
      emailsDelivered: 0,
    },
  };
}

export const schoolDashboardService = {
  /**
   * Fast path: builds or fetches tenant-cached dashboard state directly from the
   * already-verified session school & user records (0 redundant DB round-trips).
   */
  async getDashboardDataFromSession(
    school: SchoolRecord,
    user: Pick<UserRecord, "id" | "name" | "role" | "schoolId">,
  ): Promise<{ data: SchoolDashboardData; cacheHit: boolean }> {
    if (!school?.id) {
      throw new TenantNotFoundError("Registered school not found.");
    }
    if (user.role !== "PLATFORM_SUPER_ADMIN" && user.schoolId !== school.id) {
      throw new TenantMismatchError("Access denied: requested school belongs to another tenant.");
    }

    const cacheKey = `dashboard:v1:${user.id}`;
    const cached = await tenantCache.get<SchoolDashboardData>(school.id, cacheKey);
    if (cached && cached.school?.id === school.id) {
      return { data: cached, cacheHit: true };
    }

    const fresh = buildEmptyDashboardData(school, user);
    await tenantCache.set(school.id, cacheKey, fresh, DASHBOARD_CACHE_TTL_SECONDS);
    return { data: fresh, cacheHit: false };
  },

  /**
   * Returns tenant-scoped dashboard state for the registered school.
   * Rejects missing schools and cross-tenant user access.
   */
  async getDashboardData(schoolId: string, currentUserId?: string): Promise<SchoolDashboardData> {
    if (!schoolId?.trim()) {
      throw new TenantNotFoundError("School tenant identifier is required.");
    }

    const school = await authRepository.findSchoolById(schoolId);
    if (!school) {
      throw new TenantNotFoundError("Registered school not found.");
    }

    const user = currentUserId ? await authRepository.findUserById(currentUserId) : null;
    if (user && user.role !== "PLATFORM_SUPER_ADMIN" && user.schoolId !== school.id) {
      throw new TenantMismatchError("Access denied: requested school belongs to another tenant.");
    }

    const cacheKey = user ? `dashboard:v1:${user.id}` : "dashboard:v1:anon";
    const cached = await tenantCache.get<SchoolDashboardData>(school.id, cacheKey);
    if (cached && cached.school?.id === school.id) {
      return cached;
    }

    const fresh = buildEmptyDashboardData(school, user);
    await tenantCache.set(school.id, cacheKey, fresh, DASHBOARD_CACHE_TTL_SECONDS);
    return fresh;
  },

  /**
   * Returns only the schools the authenticated user is authorized to view.
   * Non-platform users are strictly scoped to their own tenant school.
   */
  async getSchoolsForUser(
    user: Pick<UserRecord, "role" | "schoolId">,
    sessionSchool?: SchoolRecord | null,
  ): Promise<SchoolRecord[]> {
    if (user.role === "PLATFORM_SUPER_ADMIN") {
      return authRepository.getAllSchools();
    }

    const ownSchoolId = sessionSchool?.id || user.schoolId;
    if (!ownSchoolId) {
      return [];
    }

    const ownSchool =
      sessionSchool && sessionSchool.id === ownSchoolId
        ? sessionSchool
        : await authRepository.findSchoolById(ownSchoolId);

    return ownSchool ? [ownSchool] : [];
  },
};
