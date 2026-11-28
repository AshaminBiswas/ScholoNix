import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { authorize } from "@/server/authorization/permissions";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { studentPromotionService } from "@/server/school/student-promotion-service";
import { promotionFilterQuerySchema } from "@/modules/students/promotion-schemas";
import { logAuditEvent } from "@/server/security/audit-logger";

export const dynamic = "force-dynamic";

function csvCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    authorize(
      {
        id: resolved.ctx.userId,
        role: resolved.ctx.role,
        schoolId: resolved.ctx.schoolId,
      },
      "students:export",
    );

    const url = new URL(req.url);
    const parsed = promotionFilterQuerySchema.parse({
      academicYear: url.searchParams.get("academicYear") || undefined,
      fromGrade: url.searchParams.get("fromGrade") || undefined,
      toGrade: url.searchParams.get("toGrade") || undefined,
      section: url.searchParams.get("section") || undefined,
      status: url.searchParams.get("status") || undefined,
      search: url.searchParams.get("search") || undefined,
    });

    const overview = await studentPromotionService.getOverview(resolved.ctx, {
      academicYear: parsed.academicYear,
      fromGrade: parsed.fromGrade,
      toGrade: parsed.toGrade,
      section: parsed.section,
      status: parsed.status,
      search: parsed.search,
    });

    const ayLabel = parsed.academicYear || overview.academicYears[0] || "current";

    const headers = [
      "Admission No",
      "Student Name",
      "Current Class",
      "Section",
      "Next Class",
      "Next Section",
      "Result Grade",
      "Promotion %",
      "Attendance %",
      "Status",
      "Academic Year",
      "Remarks",
    ];

    const rows = overview.decisions.map((d) =>
      [
        csvCell(d.admissionNumber),
        csvCell(d.studentName),
        csvCell(d.currentGrade),
        csvCell(d.currentSection),
        csvCell(d.nextGrade),
        csvCell(d.nextSection),
        csvCell(d.resultGrade),
        csvCell(d.promotionPct.toFixed(1)),
        csvCell(d.attendancePct.toFixed(1)),
        csvCell(d.status),
        csvCell(d.academicYear),
        csvCell(d.remarks),
      ].join(","),
    );

    const csvContent = [headers.map(csvCell).join(","), ...rows].join("\n");

    await logAuditEvent({
      schoolId: resolved.ctx.schoolId,
      actorId: resolved.ctx.userId,
      action: "PROMOTION_REPORT_EXPORTED",
      entityType: "StudentPromotion",
      entityId: ayLabel,
      details: { exportedRows: overview.decisions.length },
      ipAddress: resolved.ctx.ipAddress,
      userAgent: resolved.ctx.userAgent,
    });

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="student-promotions-${ayLabel}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
