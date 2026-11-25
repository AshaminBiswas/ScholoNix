import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { authRepository } from "@/server/auth/auth-repository";
import { sessionService } from "@/server/auth/session-service";
import type { AdmissionsActorContext } from "@/server/school/admissions-service";
import type {
  AdmissionApplicationStatusType,
  AdmissionsDatePreset,
  AdmissionsOverviewFilters,
  AdmissionsTrendGranularity,
  DocumentVerificationStatusType,
} from "@/modules/school/admissions/types";

export async function resolveApiTenantActor(
  req: NextRequest,
): Promise<{ ctx: AdmissionsActorContext } | { response: NextResponse }> {
  const session = await sessionService.getSessionFromRequest(req);
  if (!session || !session.user) {
    return {
      response: NextResponse.json(
        {
          authenticated: false,
          error: {
            code: "UNAUTHENTICATED",
            message: "Unauthorized: Active school session required.",
          },
        },
        { status: 401 },
      ),
    };
  }

  const url = new URL(req.url);
  const requestedSchoolId = url.searchParams.get("schoolId")?.trim();
  const requestedSlug = url.searchParams.get("schoolSlug")?.trim().toLowerCase();
  const ownSchoolId = session.school?.id || session.user.schoolId;
  const isSuperAdmin = session.user.role === "PLATFORM_SUPER_ADMIN";

  if (!isSuperAdmin) {
    if (
      (requestedSchoolId && requestedSchoolId !== ownSchoolId) ||
      (requestedSlug && session.school && requestedSlug !== session.school.slug.toLowerCase())
    ) {
      return {
        response: NextResponse.json(
          {
            authenticated: true,
            error: {
              code: "TENANT_MISMATCH",
              message: "Forbidden: Cross-tenant school access is prohibited.",
            },
          },
          { status: 403 },
        ),
      };
    }

    const school =
      session.school ||
      (ownSchoolId ? await authRepository.findSchoolById(ownSchoolId) : null);
    if (!school) {
      return {
        response: NextResponse.json(
          { error: { code: "TENANT_NOT_FOUND", message: "No school found for session." } },
          { status: 404 },
        ),
      };
    }

    return {
      ctx: {
        userId: session.user.id,
        userName: session.user.name,
        role: session.user.role,
        schoolId: school.id,
        schoolSlug: school.slug,
        schoolName: school.name,
        ipAddress: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      },
    };
  }

  // Platform super-admin resolution
  const targetSchool = requestedSlug
    ? await authRepository.findSchoolBySlug(requestedSlug)
    : requestedSchoolId
      ? await authRepository.findSchoolById(requestedSchoolId)
      : session.school ||
        (ownSchoolId ? await authRepository.findSchoolById(ownSchoolId) : null);

  if (!targetSchool) {
    return {
      response: NextResponse.json(
        { error: { code: "TENANT_NOT_FOUND", message: "Target school tenant not found." } },
        { status: 404 },
      ),
    };
  }

  return {
    ctx: {
      userId: session.user.id,
      userName: session.user.name,
      role: session.user.role,
      schoolId: targetSchool.id,
      schoolSlug: targetSchool.slug,
      schoolName: targetSchool.name,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    },
  };
}

const VALID_STATUSES = new Set<string>([
  "all",
  "UNDER_REVIEW",
  "DOCUMENTS_PENDING",
  "SHORTLISTED",
  "ADMITTED",
  "REJECTED",
]);

const VALID_VERIFICATIONS = new Set<string>(["all", "PENDING", "VERIFIED", "REJECTED"]);
const VALID_DATE_PRESETS = new Set<string>(["all", "year", "30d", "90d", "custom"]);

export function parseAdmissionsOverviewFiltersFromSearchParams(
  searchParams: URLSearchParams,
): Partial<AdmissionsOverviewFilters> {
  const filters: Partial<AdmissionsOverviewFilters> = {};

  const ay = searchParams.get("academicYear")?.trim();
  if (ay) filters.academicYear = ay;

  const grade = searchParams.get("grade")?.trim();
  if (grade) filters.grade = grade;

  const status = searchParams.get("status")?.trim();
  if (status && VALID_STATUSES.has(status)) {
    filters.status = status as AdmissionApplicationStatusType | "all";
  }

  const verificationStatus = searchParams.get("verificationStatus")?.trim();
  if (verificationStatus && VALID_VERIFICATIONS.has(verificationStatus)) {
    filters.verificationStatus = verificationStatus as DocumentVerificationStatusType | "all";
  }

  const datePreset = searchParams.get("datePreset")?.trim();
  if (datePreset && VALID_DATE_PRESETS.has(datePreset)) {
    filters.datePreset = datePreset as AdmissionsDatePreset;
  }

  const from = searchParams.get("from")?.trim();
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) filters.from = from;

  const to = searchParams.get("to")?.trim();
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) filters.to = to;

  const granularity = searchParams.get("granularity")?.trim();
  if (granularity === "month" || granularity === "week") {
    filters.granularity = granularity as AdmissionsTrendGranularity;
  }

  const search = searchParams.get("search")?.trim();
  if (search !== undefined) filters.search = search.slice(0, 120);

  const pageRaw = Number(searchParams.get("page"));
  if (Number.isFinite(pageRaw) && pageRaw >= 1) {
    filters.page = Math.floor(pageRaw);
  }

  const pageSizeRaw = Number(searchParams.get("pageSize"));
  if (Number.isFinite(pageSizeRaw) && pageSizeRaw >= 1) {
    filters.pageSize = Math.min(50, Math.floor(pageSizeRaw));
  }

  return filters;
}
