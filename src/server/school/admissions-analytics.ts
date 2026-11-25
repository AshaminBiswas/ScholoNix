import type {
  AdmissionActivityRecord,
  AdmissionApplicationRecord,
  AdmissionApplicationStatusType,
  AdmissionEnquiryRecord,
  AdmissionReminderRecord,
  AdmissionSettingRecord,
  AdmissionsGradeCount,
  AdmissionsOverviewData,
  AdmissionsOverviewFilters,
  AdmissionsStatusSlice,
  AdmissionsTrendPoint,
} from "@/modules/school/admissions/types";
import { ADMISSION_STATUS_META } from "@/modules/school/admissions/types";

const INDIA_MONTH_ORDER = [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2]; // Apr .. Mar
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function getCurrentAcademicYearLabel(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "Asia/Kolkata",
  }).formatToParts(now);

  const yearNum = Number(parts.find((p) => p.type === "year")?.value || now.getFullYear());
  const monthNum = Number(parts.find((p) => p.type === "month")?.value || now.getMonth() + 1);
  const startYear = monthNum >= 4 ? yearNum : yearNum - 1;
  return `${startYear} – ${startYear + 1}`;
}

export function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function computePercentDelta(current: number, previous: number): number | null {
  if (previous <= 0) {
    return null;
  }
  return roundToOneDecimal(((current - previous) / previous) * 100);
}

export function formatShortGradeLabel(grade: string): string {
  return grade.replace(/^Class\s+/i, "").trim() || grade;
}

export interface ResolvedDateWindow {
  currentStart: number | null;
  currentEnd: number | null;
  prevStart: number | null;
  prevEnd: number | null;
}

function parseAcademicYearStartEnd(academicYear: string): { startMs: number; endMs: number } | null {
  const match = academicYear.match(/(\d{4})\s*[-–—]\s*(\d{4})/);
  if (!match) return null;
  const startYear = Number(match[1]);
  const endYear = Number(match[2]);
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) return null;
  const startMs = Date.UTC(startYear, 3, 1, 0, 0, 0, 0); // Apr 1
  const endMs = Date.UTC(endYear, 2, 31, 23, 59, 59, 999); // Mar 31
  return { startMs, endMs };
}

export function resolveDateRangeWindow(
  filters: Pick<AdmissionsOverviewFilters, "datePreset" | "from" | "to" | "academicYear">,
  now: Date = new Date(),
): ResolvedDateWindow {
  const nowMs = now.getTime();
  const DAY_MS = 24 * 60 * 60 * 1000;

  if (filters.datePreset === "30d") {
    const currentStart = nowMs - 30 * DAY_MS;
    const prevStart = currentStart - 30 * DAY_MS;
    return { currentStart, currentEnd: nowMs, prevStart, prevEnd: currentStart - 1 };
  }

  if (filters.datePreset === "90d") {
    const currentStart = nowMs - 90 * DAY_MS;
    const prevStart = currentStart - 90 * DAY_MS;
    return { currentStart, currentEnd: nowMs, prevStart, prevEnd: currentStart - 1 };
  }

  if (filters.datePreset === "custom" && (filters.from || filters.to)) {
    const currentStart = filters.from ? Date.parse(`${filters.from}T00:00:00.000Z`) : null;
    const currentEnd = filters.to ? Date.parse(`${filters.to}T23:59:59.999Z`) : nowMs;
    if (
      currentStart !== null &&
      Number.isFinite(currentStart) &&
      currentEnd !== null &&
      Number.isFinite(currentEnd) &&
      currentEnd >= currentStart
    ) {
      const span = Math.max(DAY_MS, currentEnd - currentStart);
      return {
        currentStart,
        currentEnd,
        prevStart: currentStart - span - 1,
        prevEnd: currentStart - 1,
      };
    }
    return {
      currentStart: currentStart && Number.isFinite(currentStart) ? currentStart : null,
      currentEnd: currentEnd && Number.isFinite(currentEnd) ? currentEnd : null,
      prevStart: null,
      prevEnd: null,
    };
  }

  if (filters.datePreset === "year" && filters.academicYear !== "all") {
    const ayWindow = parseAcademicYearStartEnd(filters.academicYear);
    if (ayWindow) {
      const span = ayWindow.endMs - ayWindow.startMs;
      return {
        currentStart: ayWindow.startMs,
        currentEnd: ayWindow.endMs,
        prevStart: ayWindow.startMs - span - 1,
        prevEnd: ayWindow.startMs - 1,
      };
    }
  }

  return { currentStart: null, currentEnd: null, prevStart: null, prevEnd: null };
}

function isWithinRange(iso: string, startMs: number | null, endMs: number | null): boolean {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return false;
  if (startMs !== null && ts < startMs) return false;
  if (endMs !== null && ts > endMs) return false;
  return true;
}

function getPreviousAcademicYear(academicYear: string): string | null {
  const match = academicYear.match(/(\d{4})\s*[-–—]\s*(\d{4})/);
  if (!match) return null;
  const start = Number(match[1]) - 1;
  const end = Number(match[2]) - 1;
  return `${start} – ${end}`;
}

export function buildTrendSeries(
  applications: AdmissionApplicationRecord[],
  granularity: "month" | "week",
  academicYear: string,
): AdmissionsTrendPoint[] {
  if (applications.length === 0) {
    return [];
  }

  if (granularity === "week") {
    const weekBuckets = new Map<string, { label: string; count: number; sortKey: number }>();
    for (const app of applications) {
      const d = new Date(app.appliedAt);
      if (Number.isNaN(d.getTime())) continue;
      // Monday-aligned UTC week start
      const day = d.getUTCDay();
      const diff = (day + 6) % 7;
      const weekStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
      const key = weekStart.toISOString().slice(0, 10);
      const label = new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }).format(weekStart);
      const existing = weekBuckets.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        weekBuckets.set(key, { label, count: 1, sortKey: weekStart.getTime() });
      }
    }
    return Array.from(weekBuckets.entries())
      .sort((a, b) => a[1].sortKey - b[1].sortKey)
      .slice(-12)
      .map(([key, val]) => ({ key, label: val.label, count: val.count }));
  }

  // Monthly grouping: if specific academic year is chosen and records fall within Apr-Mar,
  // render a continuous academic-year series from Apr through the latest active month (or full 12).
  const monthCounts = new Map<number, number>();
  const yearMonthBuckets = new Map<string, { label: string; count: number; sortKey: number }>();

  for (const app of applications) {
    const d = new Date(app.appliedAt);
    if (Number.isNaN(d.getTime())) continue;
    const month = d.getUTCMonth();
    const year = d.getUTCFullYear();
    monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    const existing = yearMonthBuckets.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      yearMonthBuckets.set(key, {
        label: `${MONTH_NAMES[month]} '${String(year).slice(-2)}`,
        count: 1,
        sortKey: Date.UTC(year, month, 1),
      });
    }
  }

  if (academicYear !== "all") {
    return INDIA_MONTH_ORDER.map((m) => ({
      key: `m-${m}`,
      label: MONTH_NAMES[m] ?? "",
      count: monthCounts.get(m) || 0,
    }));
  }

  return Array.from(yearMonthBuckets.entries())
    .sort((a, b) => a[1].sortKey - b[1].sortKey)
    .slice(-12)
    .map(([key, val]) => ({ key, label: val.label, count: val.count }));
}

export function buildGradeCounts(
  applications: AdmissionApplicationRecord[],
  configuredGrades: string[],
): AdmissionsGradeCount[] {
  if (applications.length === 0) {
    return [];
  }

  const counts = new Map<string, number>();
  for (const app of applications) {
    counts.set(app.gradeApplied, (counts.get(app.gradeApplied) || 0) + 1);
  }

  const orderedGrades: string[] = [];
  for (const g of configuredGrades) {
    if (counts.has(g)) {
      orderedGrades.push(g);
    }
  }
  for (const g of counts.keys()) {
    if (!orderedGrades.includes(g)) {
      orderedGrades.push(g);
    }
  }

  return orderedGrades.map((grade) => ({
    grade,
    shortLabel: formatShortGradeLabel(grade),
    count: counts.get(grade) || 0,
  }));
}

export function buildStatusBreakdown(
  applications: AdmissionApplicationRecord[],
): AdmissionsOverviewData["statusBreakdown"] {
  const total = applications.length;
  const statuses: AdmissionApplicationStatusType[] = [
    "UNDER_REVIEW",
    "DOCUMENTS_PENDING",
    "SHORTLISTED",
    "ADMITTED",
    "REJECTED",
  ];

  const counts: Record<AdmissionApplicationStatusType, number> = {
    UNDER_REVIEW: 0,
    DOCUMENTS_PENDING: 0,
    SHORTLISTED: 0,
    ADMITTED: 0,
    REJECTED: 0,
  };

  for (const app of applications) {
    counts[app.status] += 1;
  }

  const slices: AdmissionsStatusSlice[] = statuses.map((status) => {
    const count = counts[status];
    return {
      status,
      label: ADMISSION_STATUS_META[status].label,
      count,
      percentage: total > 0 ? roundToOneDecimal((count / total) * 100) : 0,
      color: ADMISSION_STATUS_META[status].color,
    };
  });

  return slices;
}

export function buildLiveReminders(params: {
  schoolId: string;
  settings: AdmissionSettingRecord;
  applicationsInYear: AdmissionApplicationRecord[];
  customReminders: AdmissionReminderRecord[];
}): AdmissionReminderRecord[] {
  const { schoolId, settings, applicationsInYear, customReminders } = params;
  const generated: AdmissionReminderRecord[] = [];

  if (settings.applicationDeadline) {
    const parsedDeadline = new Date(settings.applicationDeadline);
    if (!Number.isNaN(parsedDeadline.getTime())) {
      const formatted = new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(parsedDeadline);

      generated.push({
        id: `sys-deadline-${schoolId}`,
        schoolId,
        title: `Admission last date for ${settings.currentAcademicYear}: ${formatted}.`,
        academicYear: settings.currentAcademicYear,
        dueDate: settings.applicationDeadline,
        priority: "INFO",
        isCompleted: false,
        isSystemGenerated: true,
        createdAt: settings.updatedAt,
      });
    }
  }

  const pendingDocsCount = applicationsInYear.filter(
    (app) => app.verificationStatus === "PENDING" || app.status === "DOCUMENTS_PENDING",
  ).length;
  if (pendingDocsCount > 0) {
    generated.push({
      id: `sys-pending-docs-${schoolId}`,
      schoolId,
      title: `${pendingDocsCount} ${pendingDocsCount === 1 ? "application is" : "applications are"} pending document verification.`,
      academicYear: settings.currentAcademicYear,
      dueDate: null,
      priority: "WARNING",
      isCompleted: false,
      isSystemGenerated: true,
      createdAt: new Date().toISOString(),
    });
  }

  const shortlistedCount = applicationsInYear.filter((app) => app.status === "SHORTLISTED").length;
  if (shortlistedCount > 0) {
    generated.push({
      id: `sys-shortlisted-${schoolId}`,
      schoolId,
      title: `${shortlistedCount} shortlisted ${shortlistedCount === 1 ? "student is" : "students are"} awaiting admission confirmation.`,
      academicYear: settings.currentAcademicYear,
      dueDate: null,
      priority: "INFO",
      isCompleted: false,
      isSystemGenerated: true,
      createdAt: new Date().toISOString(),
    });
  }

  const sortedCustom = [...customReminders].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  return [...generated, ...sortedCustom];
}

export function computeAdmissionsOverviewAnalytics(params: {
  schoolId: string;
  filters: AdmissionsOverviewFilters;
  allApplications: AdmissionApplicationRecord[];
  allEnquiries: AdmissionEnquiryRecord[];
  customReminders: AdmissionReminderRecord[];
  activities: AdmissionActivityRecord[];
  settings: AdmissionSettingRecord;
  permissions: AdmissionsOverviewData["permissions"];
  now?: Date;
}): AdmissionsOverviewData {
  const {
    schoolId,
    filters,
    allApplications,
    allEnquiries,
    customReminders,
    activities,
    settings,
    permissions,
    now = new Date(),
  } = params;

  // Defense-in-depth strict tenant filtering
  const tenantApplications = allApplications.filter((a) => a.schoolId === schoolId);
  const tenantEnquiries = allEnquiries.filter((e) => e.schoolId === schoolId);
  const tenantReminders = customReminders.filter((r) => r.schoolId === schoolId);
  const tenantActivities = activities
    .filter((act) => act.schoolId === schoolId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  // Collect distinct academic years present plus configured current year
  const yearSet = new Set<string>([settings.currentAcademicYear]);
  for (const app of tenantApplications) yearSet.add(app.academicYear);
  for (const enq of tenantEnquiries) yearSet.add(enq.academicYear);
  const availableAcademicYears = Array.from(yearSet).sort().reverse();

  // Base cohort matching academicYear + grade + datePreset/from/to (used for KPIs, Funnel, Trend, Charts)
  const dateWindow = resolveDateRangeWindow(filters, now);

  const matchesCohort = (
    item: { academicYear: string; gradeApplied: string },
    timestampIso: string,
    usePreviousWindow: boolean,
  ): boolean => {
    if (filters.grade !== "all" && item.gradeApplied !== filters.grade) {
      return false;
    }

    if (!usePreviousWindow) {
      if (filters.academicYear !== "all" && item.academicYear !== filters.academicYear) {
        return false;
      }
      return isWithinRange(timestampIso, dateWindow.currentStart, dateWindow.currentEnd);
    }

    if (dateWindow.prevStart !== null && dateWindow.prevEnd !== null) {
      if (
        filters.academicYear !== "all" &&
        filters.datePreset === "year"
      ) {
        const prevAy = getPreviousAcademicYear(filters.academicYear);
        return prevAy ? item.academicYear === prevAy : false;
      }
      if (filters.academicYear !== "all" && item.academicYear !== filters.academicYear) {
        return false;
      }
      return isWithinRange(timestampIso, dateWindow.prevStart, dateWindow.prevEnd);
    }

    if (filters.academicYear !== "all") {
      const prevAy = getPreviousAcademicYear(filters.academicYear);
      return prevAy ? item.academicYear === prevAy : false;
    }

    return false;
  };

  const cohortApplications = tenantApplications.filter((app) =>
    matchesCohort(app, app.appliedAt, false),
  );
  const previousApplications = tenantApplications.filter((app) =>
    matchesCohort(app, app.appliedAt, true),
  );
  const cohortEnquiries = tenantEnquiries.filter((enq) =>
    matchesCohort(enq, enq.createdAt, false),
  );

  // KPI & Funnel calculations
  const totalCount = cohortApplications.length;
  const prevTotalCount = previousApplications.length;

  const shortlistedCount = cohortApplications.filter((a) => a.status === "SHORTLISTED").length;
  const prevShortlistedCount = previousApplications.filter((a) => a.status === "SHORTLISTED").length;

  const admittedCount = cohortApplications.filter((a) => a.status === "ADMITTED").length;
  const prevAdmittedCount = previousApplications.filter((a) => a.status === "ADMITTED").length;

  const conversionRate = totalCount > 0 ? roundToOneDecimal((admittedCount / totalCount) * 100) : 0;
  const prevConversionRate =
    prevTotalCount > 0 ? roundToOneDecimal((prevAdmittedCount / prevTotalCount) * 100) : 0;
  const conversionDeltaPp =
    prevTotalCount > 0 ? roundToOneDecimal(conversionRate - prevConversionRate) : null;

  const shortlistedPipelineCount = cohortApplications.filter(
    (a) => a.status === "SHORTLISTED" || a.status === "ADMITTED",
  ).length;

  // Table filter includes status, verificationStatus, and search query
  const q = filters.search.trim().toLowerCase();
  const tableFiltered = cohortApplications
    .filter((app) => {
      if (filters.status !== "all" && app.status !== filters.status) return false;
      if (
        filters.verificationStatus !== "all" &&
        app.verificationStatus !== filters.verificationStatus
      ) {
        return false;
      }
      if (q) {
        const hay = `${app.applicationCode} ${app.studentName} ${app.guardianName} ${app.gradeApplied}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => Date.parse(b.appliedAt) - Date.parse(a.appliedAt));

  const pageSize = Math.min(50, Math.max(1, filters.pageSize || 10));
  const totalFiltered = tableFiltered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const page = Math.min(totalPages, Math.max(1, filters.page || 1));
  const pagedApplications = tableFiltered.slice((page - 1) * pageSize, page * pageSize);

  const admittedStudents = cohortApplications
    .filter((a) => {
      if (a.status !== "ADMITTED") return false;
      if (q) {
        const hay = `${a.applicationCode} ${a.admissionNumber || ""} ${a.studentName} ${a.gradeApplied}`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    })
    .sort((a, b) => Date.parse(b.admittedAt || b.appliedAt) - Date.parse(a.admittedAt || a.appliedAt));

  const filteredEnquiries = cohortEnquiries
    .filter((enq) => {
      if (q) {
        const hay = `${enq.enquiryCode} ${enq.studentName} ${enq.guardianName} ${enq.gradeApplied}`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const reminders = buildLiveReminders({
    schoolId,
    settings,
    applicationsInYear: tenantApplications.filter((a) =>
      filters.academicYear === "all"
        ? a.academicYear === settings.currentAcademicYear
        : a.academicYear === filters.academicYear,
    ),
    customReminders: tenantReminders,
  });

  const gradeOptions = Array.from(
    new Set([...settings.enabledGrades, ...tenantApplications.map((a) => a.gradeApplied)]),
  );

  return {
    schoolId,
    filters: { ...filters, page, pageSize },
    availableAcademicYears,
    availableGrades: gradeOptions,
    settings,
    kpis: {
      totalApplications: {
        value: totalCount,
        previousValue: prevTotalCount,
        deltaPercent: computePercentDelta(totalCount, prevTotalCount),
      },
      shortlisted: {
        value: shortlistedCount,
        previousValue: prevShortlistedCount,
        deltaPercent: computePercentDelta(shortlistedCount, prevShortlistedCount),
      },
      admitted: {
        value: admittedCount,
        previousValue: prevAdmittedCount,
        deltaPercent: computePercentDelta(admittedCount, prevAdmittedCount),
      },
      conversionRate: {
        rate: conversionRate,
        previousRate: prevConversionRate,
        deltaPercentagePoints: conversionDeltaPp,
      },
    },
    funnel: {
      enquiries: cohortEnquiries.length,
      applications: totalCount,
      shortlistedPipeline: shortlistedPipelineCount,
      admitted: admittedCount,
      conversionRate,
      deltaPercentagePoints: conversionDeltaPp,
    },
    trend: buildTrendSeries(cohortApplications, filters.granularity, filters.academicYear),
    byGrade: buildGradeCounts(cohortApplications, settings.enabledGrades),
    statusBreakdown: buildStatusBreakdown(cohortApplications),
    applications: pagedApplications,
    pagination: {
      total: totalFiltered,
      page,
      pageSize,
      totalPages,
    },
    enquiries: filteredEnquiries,
    admittedStudents,
    activities: tenantActivities.slice(0, 20),
    reminders,
    permissions,
  };
}

/**
 * Escapes CSV fields against RFC 4180 delimiters and spreadsheet formula injection.
 */
export function escapeCsvCell(raw: string | number | null | undefined): string {
  const str = raw === null || raw === undefined ? "" : String(raw);
  const formulaSafe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  if (/[",\r\n]/.test(formulaSafe)) {
    return `"${formulaSafe.replace(/"/g, '""')}"`;
  }
  return formulaSafe;
}

export function buildAdmissionsCsv(applications: AdmissionApplicationRecord[]): string {
  const headers = [
    "Application ID",
    "Admission Number",
    "Student Name",
    "Grade Applied",
    "Academic Year",
    "Applied Date",
    "Status",
    "Verification Status",
    "Guardian Name",
    "Guardian Relation",
    "Guardian Phone",
    "Guardian Email",
    "Previous School",
  ];

  const rows = applications.map((app) => [
    escapeCsvCell(app.applicationCode),
    escapeCsvCell(app.admissionNumber || ""),
    escapeCsvCell(app.studentName),
    escapeCsvCell(app.gradeApplied),
    escapeCsvCell(app.academicYear),
    escapeCsvCell(app.appliedAt.slice(0, 10)),
    escapeCsvCell(ADMISSION_STATUS_META[app.status].label),
    escapeCsvCell(app.verificationStatus),
    escapeCsvCell(app.guardianName),
    escapeCsvCell(app.guardianRelation),
    escapeCsvCell(app.guardianPhone),
    escapeCsvCell(app.guardianEmail || ""),
    escapeCsvCell(app.previousSchool || ""),
  ]);

  return [headers.map(escapeCsvCell).join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}
