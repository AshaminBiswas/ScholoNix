import "server-only";
import { authRepository, SchoolRecord, UserRecord } from "@/server/auth/auth-repository";
import { tenantCache } from "@/server/integrations/redis";
import { ServiceUnavailableError, TenantMismatchError, TenantNotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { captureException } from "@/lib/observability/sentry";
import { formatAvatarInitials, formatRoleLabel } from "@/modules/school/utils/shell-props";
import { ADMISSION_STATUS_META } from "@/modules/school/admissions/types";
import type { SchoolDashboardData } from "@/modules/school/types";
import { admissionsRepository } from "./admissions-repository";
import { roundToOneDecimal } from "./admissions-analytics";

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

function formatSafeIstDate(iso: string, includeTime: boolean = false): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat(
    "en-IN",
    includeTime
      ? {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Kolkata",
        }
      : {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        },
  ).format(parsed);
}

function isValidCachedDashboardData(
  cached: unknown,
  expectedSchoolId: string,
): cached is SchoolDashboardData {
  if (!cached || typeof cached !== "object") return false;
  const d = cached as Partial<SchoolDashboardData>;
  return Boolean(
    d.school?.id === expectedSchoolId &&
      d.currentUser &&
      d.academicSession &&
      d.kpis?.totalStudents &&
      d.kpis?.totalStaff &&
      d.kpis?.pendingAdmissions &&
      d.kpis?.feeDues &&
      d.studentOverview &&
      Array.isArray(d.studentOverview.sections) &&
      d.attendanceToday &&
      Array.isArray(d.todayTasks) &&
      d.feeCollection &&
      Array.isArray(d.feeCollection.monthlyTrends) &&
      Array.isArray(d.upcomingEvents) &&
      Array.isArray(d.recentAdmissions) &&
      Array.isArray(d.recentActivities) &&
      Array.isArray(d.classStrength) &&
      d.academicPerformance &&
      Array.isArray(d.academicPerformance.termTrends) &&
      Array.isArray(d.academicPerformance.topClasses) &&
      d.admissionFunnel &&
      d.staffOverview &&
      d.genderBreakdown &&
      Array.isArray(d.keyInsights) &&
      Array.isArray(d.notices) &&
      d.communicationSummary,
  );
}

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

async function buildLiveDashboardData(
  school: SchoolRecord,
  user?: Pick<UserRecord, "name" | "role"> | null,
): Promise<SchoolDashboardData> {
  const base = buildEmptyDashboardData(school, user);
  let snapshot;
  try {
    snapshot = await admissionsRepository.getTenantSnapshot(school.id);
  } catch (err) {
    if (err instanceof ServiceUnavailableError) {
      logger.warn(
        { schoolId: school.id, error: err.message },
        "[DashboardService] Admissions summary unavailable; returning base dashboard",
      );
      return base;
    }
    captureException(err, {
      schoolId: school.id,
      tags: { area: "buildLiveDashboardData" },
    });
    return base;
  }

  try {
    const pendingCount = snapshot.applications.filter(
      (app) => app.status !== "ADMITTED" && app.status !== "REJECTED",
    ).length;
    const totalApps = snapshot.applications.length;
    const shortlistedPipeline = snapshot.applications.filter(
      (app) => app.status === "SHORTLISTED" || app.status === "ADMITTED",
    ).length;
    const admittedCount = snapshot.applications.filter((app) => app.status === "ADMITTED").length;
    const conversionRate = totalApps > 0 ? roundToOneDecimal((admittedCount / totalApps) * 100) : 0;

    base.kpis.totalStudents = {
      value: admittedCount,
      change: 0,
    };
    base.kpis.pendingAdmissions = {
      value: pendingCount,
      change: 0,
    };
    base.admissionFunnel = {
      enquiries: snapshot.enquiries.length,
      applications: totalApps,
      shortlisted: shortlistedPipeline,
      admitted: admittedCount,
      conversionRate,
      trendVsLastYear: 0,
    };
    base.recentAdmissions = snapshot.applications.slice(0, 5).map((app) => {
      const mappedStatus =
        app.status === "ADMITTED"
          ? "Approved"
          : app.status === "DOCUMENTS_PENDING"
            ? "Documents Pending"
            : app.status === "REJECTED"
              ? "Waitlisted"
              : "Under Review";
      const meta = ADMISSION_STATUS_META[app.status] ?? ADMISSION_STATUS_META.UNDER_REVIEW;
      return {
        id: app.id,
        name: app.studentName,
        classApplied: app.gradeApplied,
        status: mappedStatus,
        statusColor: meta.textClass,
        statusBg: `${meta.bgClass} ${meta.borderClass}`,
        appliedOn: formatSafeIstDate(app.appliedAt, false),
        initials: formatAvatarInitials(app.studentName),
        avatarBg: "bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]",
      };
    });
    base.recentActivities = snapshot.activities.slice(0, 5).map((act) => ({
      id: act.id,
      description: act.summary,
      timestamp: formatSafeIstDate(act.createdAt, true),
      type: "admission",
    }));

    return base;
  } catch (err) {
    captureException(err, {
      schoolId: school.id,
      tags: { area: "buildLiveDashboardData.map" },
    });
    return base;
  }
}

export const schoolDashboardService = {
  getSafeFallbackDashboardData(
    school: SchoolRecord,
    user?: Pick<UserRecord, "name" | "role"> | null,
  ): SchoolDashboardData {
    return buildEmptyDashboardData(school, user);
  },

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
    if (isValidCachedDashboardData(cached, school.id)) {
      return { data: cached, cacheHit: true };
    }

    const fresh = await buildLiveDashboardData(school, user);
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
    if (isValidCachedDashboardData(cached, school.id)) {
      return cached;
    }

    const fresh = await buildLiveDashboardData(school, user);
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
