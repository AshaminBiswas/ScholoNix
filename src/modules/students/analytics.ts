import type {
  StudentDashboardAnalytics,
  StudentFilterParams,
  StudentLifecycleStatusValue,
  StudentRecord,
  StudentSliceDatum,
  StudentSortField,
} from "./types";

export function parseStudentFiltersFromUrl(url: URL): StudentFilterParams {
  const sp = url.searchParams;
  const page = Number(sp.get("page") || "1");
  const pageSize = Number(sp.get("pageSize") || "10");
  const statusRaw = (sp.get("status") || "ALL").toUpperCase();
  const genderRaw = sp.get("gender") || "ALL";
  const sortRaw = (sp.get("sortBy") || "admissionDate") as StudentSortField;
  const dirRaw = sp.get("sortDir") === "asc" ? "asc" : "desc";

  const validStatuses = new Set(["ALL", "ACTIVE", "INACTIVE", "TRANSFERRED", "ALUMNI", "WITHDRAWN"]);
  const validGenders = new Set(["ALL", "Male", "Female", "Other"]);
  const validSorts = new Set([
    "admissionNumber",
    "studentName",
    "grade",
    "section",
    "admissionDate",
    "status",
  ]);

  return {
    academicYear: sp.get("academicYear")?.trim() || "ALL",
    grade: sp.get("grade")?.trim() || "ALL",
    section: sp.get("section")?.trim() || "ALL",
    status: (validStatuses.has(statusRaw) ? statusRaw : "ALL") as
      | "ALL"
      | StudentLifecycleStatusValue,
    gender: (validGenders.has(genderRaw) ? genderRaw : "ALL") as
      | "ALL"
      | "Male"
      | "Female"
      | "Other",
    fromDate: sp.get("fromDate")?.trim() || undefined,
    toDate: sp.get("toDate")?.trim() || undefined,
    search: sp.get("search")?.trim() || undefined,
    groupId: sp.get("groupId")?.trim() || "ALL",
    sortBy: validSorts.has(sortRaw) ? sortRaw : "admissionDate",
    sortDir: dirRaw,
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? Math.min(100, Math.floor(pageSize)) : 10,
  };
}

const GRADE_ORDER = [
  "Nursery",
  "LKG",
  "UKG",
  "Class I",
  "Class II",
  "Class III",
  "Class IV",
  "Class V",
  "Class VI",
  "Class VII",
  "Class VIII",
  "Class IX",
  "Class X",
  "Class XI",
  "Class XII",
];

function gradeRank(grade: string): number {
  const idx = GRADE_ORDER.findIndex((g) => g.toLowerCase() === grade.toLowerCase());
  return idx === -1 ? 999 : idx;
}

function calcGrowthPct(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function normalizeGenderLabel(raw?: string | null): "Male" | "Female" | "Other" {
  const val = String(raw || "").trim().toLowerCase();
  if (val === "male" || val === "m" || val === "boy") return "Male";
  if (val === "female" || val === "f" || val === "girl") return "Female";
  return "Other";
}

export function filterAndSortStudents(
  students: StudentRecord[],
  filters?: StudentFilterParams,
): StudentRecord[] {
  const ay = filters?.academicYear && filters.academicYear !== "ALL" ? filters.academicYear : null;
  const grade = filters?.grade && filters.grade !== "ALL" ? filters.grade : null;
  const section = filters?.section && filters.section !== "ALL" ? filters.section : null;
  const status = filters?.status && filters.status !== "ALL" ? filters.status : null;
  const gender = filters?.gender && filters.gender !== "ALL" ? filters.gender : null;
  const groupId = filters?.groupId && filters.groupId !== "ALL" ? filters.groupId : null;
  const q = filters?.search?.trim().toLowerCase() || "";
  const fromMs = filters?.fromDate ? Date.parse(filters.fromDate) : NaN;
  const toMs = filters?.toDate ? Date.parse(`${filters.toDate}T23:59:59.999Z`) : NaN;

  const filtered = students.filter((s) => {
    if (ay && s.currentAcademicYear !== ay) return false;
    if (grade && s.currentGrade !== grade) return false;
    if (section && s.currentSection !== section) return false;
    if (status && s.status !== status) return false;
    if (gender && normalizeGenderLabel(s.gender) !== gender) return false;
    if (groupId && !s.groupIds.includes(groupId)) return false;

    const admMs = Date.parse(s.admissionDate);
    if (!Number.isNaN(fromMs) && admMs < fromMs) return false;
    if (!Number.isNaN(toMs) && admMs > toMs) return false;

    if (q) {
      const hay = [
        s.admissionNumber,
        s.studentIdNumber,
        s.studentName,
        s.currentGrade,
        s.currentSection,
        s.currentRollNumber,
        s.guardianName,
        s.guardianPhone,
        s.guardianEmail,
        s.email,
        s.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sortBy = filters?.sortBy ?? "admissionDate";
  const dir = filters?.sortDir === "asc" ? 1 : -1;

  return [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case "admissionNumber":
        cmp = a.admissionNumber.localeCompare(b.admissionNumber);
        break;
      case "studentName":
        cmp = a.studentName.localeCompare(b.studentName);
        break;
      case "grade":
        cmp = gradeRank(a.currentGrade) - gradeRank(b.currentGrade);
        if (cmp === 0) cmp = a.currentGrade.localeCompare(b.currentGrade);
        break;
      case "section":
        cmp = a.currentSection.localeCompare(b.currentSection);
        break;
      case "status":
        cmp = a.status.localeCompare(b.status);
        break;
      case "admissionDate":
      default:
        cmp = Date.parse(a.admissionDate) - Date.parse(b.admissionDate);
        break;
    }
    return cmp * dir;
  });
}

export function computeStudentAnalytics(
  allStudents: StudentRecord[],
  filters?: StudentFilterParams,
  configuredGrades: string[] = [],
): StudentDashboardAnalytics {
  // Scope by AY/Grade/Section/Date range (leaving status inclusive for breakdown charts when status=ALL)
  const scoped = filterAndSortStudents(allStudents, {
    ...filters,
    status: filters?.status && filters.status !== "ALL" ? filters.status : "ALL",
  });

  const now = new Date();
  const days90Ago = now.getTime() - 90 * 86_400_000;
  const days180Ago = now.getTime() - 180 * 86_400_000;

  const totalStudents = scoped.length;
  const activeStudents = scoped.filter((s) => s.status === "ACTIVE").length;
  const inactiveStudents = scoped.filter(
    (s) => s.status === "INACTIVE" || s.status === "WITHDRAWN",
  ).length;
  const transferredCount = scoped.filter((s) => s.status === "TRANSFERRED").length;
  const alumniCount = scoped.filter((s) => s.status === "ALUMNI").length;

  const newEnrolments = scoped.filter((s) => Date.parse(s.admissionDate) >= days90Ago).length;
  const prevNewEnrolments = scoped.filter((s) => {
    const t = Date.parse(s.admissionDate);
    return t >= days180Ago && t < days90Ago;
  }).length;
  const baseBeforeWindow = Math.max(0, totalStudents - newEnrolments);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const enrolmentTrend: Array<{ label: string; count: number }> = [];
  for (let i = 11; i >= 0; i -= 1) {
    const dt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const endOfMonth = Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 1);
    const cumulativeActiveOrEnrolled = scoped.filter(
      (s) => Date.parse(s.admissionDate) < endOfMonth,
    ).length;
    enrolmentTrend.push({
      label: monthNames[dt.getUTCMonth()]!,
      count: cumulativeActiveOrEnrolled,
    });
  }

  const denom = Math.max(1, totalStudents);
  const statusSlices: StudentSliceDatum[] = [
    {
      label: "Active",
      count: activeStudents,
      percentage: Math.round((activeStudents / denom) * 1000) / 10,
      color: "#22C55E",
    },
    {
      label: "Inactive",
      count: inactiveStudents,
      percentage: Math.round((inactiveStudents / denom) * 1000) / 10,
      color: "#38BDF8",
    },
    {
      label: "Transferred",
      count: transferredCount,
      percentage: Math.round((transferredCount / denom) * 1000) / 10,
      color: "#8B5CF6",
    },
    {
      label: "Alumni",
      count: alumniCount,
      percentage: Math.round((alumniCount / denom) * 1000) / 10,
      color: "#EC4899",
    },
  ];

  const gradeCounts = new Map<string, number>();
  for (const g of configuredGrades) gradeCounts.set(g, 0);
  for (const s of scoped) {
    gradeCounts.set(s.currentGrade, (gradeCounts.get(s.currentGrade) ?? 0) + 1);
  }
  const gradeBars = Array.from(gradeCounts.entries())
    .sort((a, b) => gradeRank(a[0]) - gradeRank(b[0]) || a[0].localeCompare(b[0]))
    .filter(([, count]) => count > 0 || configuredGrades.length <= 8)
    .map(([grade, count]) => ({
      grade,
      count,
      percentage: Math.round((count / denom) * 1000) / 10,
    }));

  const boys = scoped.filter((s) => normalizeGenderLabel(s.gender) === "Male").length;
  const girls = scoped.filter((s) => normalizeGenderLabel(s.gender) === "Female").length;
  const other = scoped.filter((s) => normalizeGenderLabel(s.gender) === "Other").length;

  const genderSlices: StudentSliceDatum[] = [
    {
      label: "Boys",
      count: boys,
      percentage: Math.round((boys / denom) * 1000) / 10,
      color: "#663CF6",
    },
    {
      label: "Girls",
      count: girls,
      percentage: Math.round((girls / denom) * 1000) / 10,
      color: "#EC4899",
    },
    {
      label: "Other",
      count: other,
      percentage: Math.round((other / denom) * 1000) / 10,
      color: "#0EA5E9",
    },
  ];

  const transferIn = scoped.filter(
    (s) =>
      s.admissionType === "TRANSFER" ||
      s.transfers.some((t) => t.transferType === "TRANSFER_IN"),
  ).length;
  const transferOut = scoped.filter(
    (s) =>
      s.status === "TRANSFERRED" ||
      s.transfers.some((t) => t.transferType === "TRANSFER_OUT"),
  ).length;

  const promotionPending = scoped.filter(
    (s) =>
      s.status === "ACTIVE" &&
      !s.enrollments.some((e) => e.status === "PROMOTED" && !e.isCurrent),
  ).length;

  return {
    kpis: {
      totalStudents,
      totalGrowthPct: calcGrowthPct(totalStudents, baseBeforeWindow || totalStudents),
      activeStudents,
      activeGrowthPct: calcGrowthPct(activeStudents, baseBeforeWindow || activeStudents),
      inactiveStudents,
      inactiveGrowthPct: 0,
      newEnrolments,
      newEnrolmentsGrowthPct: calcGrowthPct(newEnrolments, prevNewEnrolments),
      transferredCount,
      transferredGrowthPct: 0,
      alumniCount,
      alumniGrowthPct: 0,
    },
    enrolmentTrend,
    statusSlices,
    gradeBars,
    genderSlices,
    keyInsights: {
      enrolmentGrowthPct: calcGrowthPct(totalStudents, baseBeforeWindow || totalStudents),
      newEnrolments,
      transferIn,
      transferOut,
      promotionPending,
      inactiveStudents,
    },
    recentStudents: scoped.slice(0, 10),
  };
}
