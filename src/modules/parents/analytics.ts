import type {
  GuardianLifecycleStatus,
  GuardianPortalStatus,
  GuardianRecord,
  GuardianStudentCandidate,
  HouseholdCluster,
  ParentDashboardAnalytics,
  ParentFilterParams,
  ParentSortField,
} from "./types";

export function normalizeGuardianPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const cleaned = phone.trim().replace(/[^0-9+]/g, "");
  return cleaned.length >= 6 ? cleaned : null;
}

export function sanitizeCsvCell(value: string | number | boolean | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  const formulaSafe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${formulaSafe.replace(/"/g, '""')}"`;
}

export function parseParentFiltersFromUrl(url: URL): ParentFilterParams {
  const sp = url.searchParams;
  const page = Number(sp.get("page") || "1");
  const pageSize = Number(sp.get("pageSize") || "10");
  const portalRaw = (sp.get("portalStatus") || "ALL").toUpperCase();
  const statusRaw = (sp.get("status") || "ALL").toUpperCase();
  const sortRaw = (sp.get("sortBy") || "fullName") as ParentSortField;
  const dirRaw = sp.get("sortDir") === "desc" ? "desc" : "asc";

  const validPortal = new Set(["ALL", "NOT_INVITED", "INVITED", "ACTIVE", "SUSPENDED"]);
  const validStatus = new Set(["ALL", "ACTIVE", "INACTIVE", "ARCHIVED"]);
  const validSorts = new Set(["fullName", "phone", "wardsCount", "portalStatus", "status", "createdAt"]);

  return {
    search: sp.get("search")?.trim() || undefined,
    relation: sp.get("relation")?.trim() || "ALL",
    portalStatus: (validPortal.has(portalRaw) ? portalRaw : "ALL") as
      | "ALL"
      | GuardianPortalStatus,
    status: (validStatus.has(statusRaw) ? statusRaw : "ALL") as "ALL" | GuardianLifecycleStatus,
    grade: sp.get("grade")?.trim() || "ALL",
    multiChildOnly: sp.get("multiChildOnly") === "true",
    pickupAuthorizedOnly: sp.get("pickupAuthorizedOnly") === "true",
    feePayerOnly: sp.get("feePayerOnly") === "true",
    sortBy: validSorts.has(sortRaw) ? sortRaw : "fullName",
    sortDir: dirRaw,
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? Math.min(100, Math.floor(pageSize)) : 10,
  };
}

export function filterAndSortGuardians(
  guardians: GuardianRecord[],
  filters?: ParentFilterParams,
): GuardianRecord[] {
  const f = filters ?? {};
  const q = f.search?.toLowerCase() ?? "";

  const filtered = guardians.filter((g) => {
    if (f.status && f.status !== "ALL" && g.status !== f.status) return false;
    if (f.portalStatus && f.portalStatus !== "ALL" && g.portalStatus !== f.portalStatus) {
      return false;
    }

    const activeWards = g.wards.filter((w) => w.isActive);
    if (f.relation && f.relation !== "ALL") {
      if (!activeWards.some((w) => w.relation.toLowerCase() === f.relation!.toLowerCase())) {
        return false;
      }
    }
    if (f.grade && f.grade !== "ALL") {
      if (!activeWards.some((w) => w.currentGrade === f.grade)) {
        return false;
      }
    }
    if (f.multiChildOnly && activeWards.length < 2) return false;
    if (f.pickupAuthorizedOnly && !activeWards.some((w) => w.canPickup && !w.restrictedContact)) {
      return false;
    }
    if (f.feePayerOnly && !activeWards.some((w) => w.isFeePayer)) return false;

    if (q) {
      const wardText = activeWards
        .map((w) => `${w.studentName} ${w.admissionNumber} ${w.currentGrade}`)
        .join(" ")
        .toLowerCase();
      const hay = `${g.fullName} ${g.phone} ${g.alternatePhone ?? ""} ${g.email ?? ""} ${g.occupation ?? ""} ${wardText}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sortBy = f.sortBy ?? "fullName";
  const mult = f.sortDir === "desc" ? -1 : 1;
  return [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "wardsCount":
        return (a.wards.filter((w) => w.isActive).length - b.wards.filter((w) => w.isActive).length) * mult;
      case "phone":
        return a.phone.localeCompare(b.phone) * mult;
      case "portalStatus":
        return a.portalStatus.localeCompare(b.portalStatus) * mult;
      case "status":
        return a.status.localeCompare(b.status) * mult;
      case "createdAt":
        return a.createdAt.localeCompare(b.createdAt) * mult;
      case "fullName":
      default:
        return a.fullName.localeCompare(b.fullName) * mult;
    }
  });
}

const RELATION_PALETTE = [
  "#663CF6",
  "#10B981",
  "#0EA5E9",
  "#F59E0B",
  "#EC4899",
  "#6366F1",
];

export function computeParentAnalytics(
  guardians: GuardianRecord[],
  gradesOrder?: string[],
): ParentDashboardAnalytics {
  const totalGuardians = guardians.length;
  const activeGuardians = guardians.filter((g) => g.status === "ACTIVE").length;
  const multiChildFamilies = guardians.filter(
    (g) => g.wards.filter((w) => w.isActive).length >= 2,
  ).length;
  const portalActivated = guardians.filter((g) => g.portalStatus === "ACTIVE").length;
  const portalActivationPct =
    totalGuardians > 0 ? Math.round((portalActivated / totalGuardians) * 100) : 0;

  let pickupAuthorizedCount = 0;
  let restrictedContactsCount = 0;

  const relationCounts = new Map<string, number>();
  const gradeGuardianMap = new Map<string, Set<string>>();
  const studentSet = new Set<string>();

  for (const g of guardians) {
    const activeWards = g.wards.filter((w) => w.isActive);
    if (activeWards.some((w) => w.canPickup && !w.restrictedContact)) {
      pickupAuthorizedCount += 1;
    }
    if (activeWards.some((w) => w.restrictedContact)) {
      restrictedContactsCount += 1;
    }
    const primaryRel = activeWards[0]?.relation || "Unlinked";
    relationCounts.set(primaryRel, (relationCounts.get(primaryRel) ?? 0) + 1);
    for (const w of activeWards) {
      studentSet.add(w.studentId);
      if (!gradeGuardianMap.has(w.currentGrade)) {
        gradeGuardianMap.set(w.currentGrade, new Set());
      }
      gradeGuardianMap.get(w.currentGrade)!.add(g.id);
    }
  }

  const relationSlices = Array.from(relationCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count], idx) => ({
      label,
      count,
      percentage: totalGuardians > 0 ? Math.round((count / totalGuardians) * 100) : 0,
      color: RELATION_PALETTE[idx % RELATION_PALETTE.length]!,
    }));

  const portalOrder: Array<{ key: GuardianPortalStatus; label: string; color: string }> = [
    { key: "ACTIVE", label: "Active Portal", color: "#10B981" },
    { key: "INVITED", label: "Invited", color: "#663CF6" },
    { key: "NOT_INVITED", label: "Not Invited", color: "#94A3B8" },
    { key: "SUSPENDED", label: "Suspended", color: "#F43F5E" },
  ];
  const portalSlices = portalOrder.map((p) => {
    const count = guardians.filter((g) => g.portalStatus === p.key).length;
    return {
      label: p.label,
      count,
      percentage: totalGuardians > 0 ? Math.round((count / totalGuardians) * 100) : 0,
      color: p.color,
    };
  });

  const knownGrades = gradesOrder && gradesOrder.length > 0
    ? gradesOrder.filter((gr) => gradeGuardianMap.has(gr))
    : Array.from(gradeGuardianMap.keys());
  const remainingGrades = Array.from(gradeGuardianMap.keys()).filter(
    (gr) => !knownGrades.includes(gr),
  );
  const allGrades = [...knownGrades, ...remainingGrades];

  const gradeDistribution = allGrades.map((grade) => {
    const count = gradeGuardianMap.get(grade)?.size ?? 0;
    return {
      grade,
      count,
      percentage: totalGuardians > 0 ? Math.round((count / totalGuardians) * 100) : 0,
    };
  });

  return {
    kpis: {
      totalGuardians,
      activeGuardians,
      linkedHouseholds: studentSet.size > 0 ? guardians.filter((g) => g.wards.some((w) => w.isActive)).length : 0,
      multiChildFamilies,
      portalActivated,
      portalActivationPct,
      pickupAuthorizedCount,
      restrictedContactsCount,
    },
    relationSlices,
    portalSlices,
    gradeDistribution,
  };
}

export function buildHouseholdClusters(
  guardians: GuardianRecord[],
  students: GuardianStudentCandidate[],
): HouseholdCluster[] {
  const clusters = new Map<
    string,
    {
      matchBasis: "PHONE" | "EMAIL" | "GUARDIAN";
      matchValue: string;
      guardians: Map<string, GuardianRecord>;
      students: Map<string, GuardianStudentCandidate>;
    }
  >();

  for (const g of guardians) {
    const normPhone = normalizeGuardianPhone(g.phone);
    const normEmail = g.email?.trim().toLowerCase() || null;
    const key = normPhone ? `phone:${normPhone}` : normEmail ? `email:${normEmail}` : `guardian:${g.id}`;
    const basis: "PHONE" | "EMAIL" | "GUARDIAN" = normPhone
      ? "PHONE"
      : normEmail
        ? "EMAIL"
        : "GUARDIAN";
    const value = normPhone || normEmail || g.fullName;

    if (!clusters.has(key)) {
      clusters.set(key, {
        matchBasis: basis,
        matchValue: value,
        guardians: new Map(),
        students: new Map(),
      });
    }
    const bucket = clusters.get(key)!;
    bucket.guardians.set(g.id, g);
    for (const w of g.wards.filter((item) => item.isActive)) {
      const stu = students.find((s) => s.id === w.studentId);
      if (stu) bucket.students.set(stu.id, stu);
    }
  }

  for (const stu of students) {
    const normPhone = normalizeGuardianPhone(stu.guardianPhone);
    const normEmail = stu.guardianEmail?.trim().toLowerCase() || null;
    const key = normPhone
      ? `phone:${normPhone}`
      : normEmail
        ? `email:${normEmail}`
        : `student:${stu.id}`;
    if (!clusters.has(key)) {
      clusters.set(key, {
        matchBasis: normPhone ? "PHONE" : normEmail ? "EMAIL" : "GUARDIAN",
        matchValue: normPhone || normEmail || stu.guardianName,
        guardians: new Map(),
        students: new Map(),
      });
    }
    clusters.get(key)!.students.set(stu.id, stu);
  }

  const out: HouseholdCluster[] = [];
  for (const [clusterKey, bucket] of clusters.entries()) {
    const guardianList = Array.from(bucket.guardians.values());
    const studentList = Array.from(bucket.students.values());
    const linkedStudentIds = new Set(
      guardianList.flatMap((g) => g.wards.filter((w) => w.isActive).map((w) => w.studentId)),
    );
    const hasUnlinkedSiblings =
      studentList.length > 0 && studentList.some((s) => !linkedStudentIds.has(s.id));
    const hasMultiGuardianMergeCandidate = guardianList.length > 1;
    if (studentList.length > 1 || guardianList.length > 1 || hasUnlinkedSiblings) {
      const firstGuardian = guardianList[0];
      const firstStudent = studentList[0];
      out.push({
        clusterKey,
        householdLabel: firstGuardian
          ? `${firstGuardian.fullName} Household`
          : `${firstStudent?.guardianName ?? "Unlinked"} Household`,
        matchBasis: bucket.matchBasis,
        matchValue: bucket.matchValue,
        guardians: guardianList,
        students: studentList,
        hasMultiGuardianMergeCandidate,
        hasUnlinkedSiblings,
      });
    }
  }

  return out.sort((a, b) => b.students.length - a.students.length);
}
