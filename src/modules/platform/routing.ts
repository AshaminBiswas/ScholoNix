import type { PlatformTab } from "./types";

export type SchoolSubTab =
  | "all"
  | "profile"
  | "plan"
  | "users"
  | "students"
  | "promotions"
  | "admissions"
  | "fees"
  | "audit";

export interface PlatformRouteState {
  tab: PlatformTab;
  schoolId: string | null;
  schoolSubTab: SchoolSubTab;
  studentId: string | null;
}

const VALID_DIRECT_TABS = new Set<PlatformTab>([
  "overview",
  "employees",
  "recruitment",
  "attendance",
  "leaves",
  "payroll",
  "expenses",
  "projects",
  "tasks",
  "sales",
  "documents",
  "reports",
  "billing",
  "support",
  "audit",
  "announcements",
  "admins",
  "settings",
]);

function normalizeSchoolSubTab(raw?: string): SchoolSubTab {
  const s = (raw || "").trim().toLowerCase();
  if (s === "profile") return "profile";
  if (s === "plan" || s === "subscription" || s === "modules") return "plan";
  if (s === "users" || s === "user") return "users";
  if (s === "students" || s === "student") return "students";
  if (s === "promotions" || s === "promotion") return "promotions";
  if (s === "admissions" || s === "admission") return "admissions";
  if (s === "fees" || s === "fee") return "fees";
  if (s === "audit") return "audit";
  return "all";
}

export function normalizePlatformBasePath(raw?: string | null): string {
  const cleaned = (raw || "/admin").trim().replace(/\/+$/, "");
  if (!cleaned) return "/admin";
  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
}

export function parsePlatformSubSegments(segments?: string[]): PlatformRouteState {
  const clean = (segments || [])
    .map((s) => decodeURIComponent(s).trim())
    .filter(Boolean);

  if (clean.length === 0) {
    return { tab: "overview", schoolId: null, schoolSubTab: "all", studentId: null };
  }

  const first = clean[0]!.toLowerCase();

  if (first === "clients" || first === "clint") {
    const second = (clean[1] || "").toLowerCase();
    if (second === "users" || second === "user") {
      return { tab: "users", schoolId: null, schoolSubTab: "all", studentId: null };
    }
    if (second === "students" || second === "student") {
      return { tab: "students", schoolId: null, schoolSubTab: "all", studentId: null };
    }
    if (second === "promotions" || second === "promotion") {
      return { tab: "promotions", schoolId: null, schoolSubTab: "all", studentId: null };
    }
    if (second === "schools" || second === "school" || !second) {
      const schoolId = clean[2] || null;
      if (!schoolId) {
        return { tab: "schools", schoolId: null, schoolSubTab: "all", studentId: null };
      }
      const subTab = normalizeSchoolSubTab(clean[3]);
      const studentId = subTab === "students" && clean[4] ? clean[4] : null;
      return {
        tab: "schools",
        schoolId,
        schoolSubTab: studentId ? "students" : subTab,
        studentId,
      };
    }
  }

  if (first === "schools" || first === "school") {
    const schoolId = clean[1] || null;
    if (!schoolId) {
      return { tab: "schools", schoolId: null, schoolSubTab: "all", studentId: null };
    }
    const subTab = normalizeSchoolSubTab(clean[2]);
    const studentId = subTab === "students" && clean[3] ? clean[3] : null;
    return {
      tab: "schools",
      schoolId,
      schoolSubTab: studentId ? "students" : subTab,
      studentId,
    };
  }

  if (first === "users") {
    return { tab: "users", schoolId: null, schoolSubTab: "all", studentId: null };
  }

  if (VALID_DIRECT_TABS.has(first as PlatformTab)) {
    return {
      tab: first as PlatformTab,
      schoolId: null,
      schoolSubTab: "all",
      studentId: null,
    };
  }

  return { tab: "overview", schoolId: null, schoolSubTab: "all", studentId: null };
}

export function buildPlatformRouteUrl(basePath: string, state: PlatformRouteState): string {
  const base = normalizePlatformBasePath(basePath);
  if (state.tab === "overview") return base;
  if (state.tab === "users") return `${base}/clients/users`;
  if (state.tab === "students") return `${base}/clients/students`;
  if (state.tab === "promotions") return `${base}/clients/promotions`;
  if (state.tab === "schools") {
    if (!state.schoolId) return `${base}/clients/schools`;
    const encodedSchoolId = encodeURIComponent(state.schoolId);
    if (state.studentId) {
      return `${base}/clients/schools/${encodedSchoolId}/students/${encodeURIComponent(state.studentId)}`;
    }
    if (state.schoolSubTab && state.schoolSubTab !== "all") {
      return `${base}/clients/schools/${encodedSchoolId}/${state.schoolSubTab}`;
    }
    return `${base}/clients/schools/${encodedSchoolId}`;
  }
  return `${base}/${state.tab}`;
}

export function parsePlatformUrlPath(pathname: string, basePath: string): PlatformRouteState {
  const base = normalizePlatformBasePath(basePath);
  if (pathname === base || pathname === `${base}/`) {
    return { tab: "overview", schoolId: null, schoolSubTab: "all", studentId: null };
  }
  if (pathname.startsWith(`${base}/`)) {
    const remainder = pathname.slice(base.length + 1).split("/");
    return parsePlatformSubSegments(remainder);
  }
  return { tab: "overview", schoolId: null, schoolSubTab: "all", studentId: null };
}
