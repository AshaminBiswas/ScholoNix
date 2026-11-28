import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { parentService } from "@/server/school/parent-service";
import { parseParentFiltersFromUrl, sanitizeCsvCell } from "@/modules/parents/analytics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const filters = parseParentFiltersFromUrl(new URL(req.url));
    const data = await parentService.getDashboardData(resolved.ctx, filters);
    await parentService.assertExportAuthorized(resolved.ctx, data.filteredGuardians.length);

    const headers = [
      "Guardian ID",
      "Full Name",
      "Phone",
      "Email",
      "Linked Wards",
      "Relations",
      "Pickup Authorized",
      "Fee Payer",
      "Portal Status",
      "Status",
    ];
    const lines = [
      headers.map(sanitizeCsvCell).join(","),
      ...data.filteredGuardians.map((g) => {
        const activeWards = g.wards.filter((w) => w.isActive);
        return [
          g.id,
          g.fullName,
          g.phone,
          g.email ?? "",
          activeWards.map((w) => `${w.studentName} (${w.currentGrade})`).join("; "),
          Array.from(new Set(activeWards.map((w) => w.relation))).join("; "),
          activeWards.some((w) => w.canPickup && !w.restrictedContact) ? "Yes" : "No",
          activeWards.some((w) => w.isFeePayer) ? "Yes" : "No",
          g.portalStatus,
          g.status,
        ]
          .map(sanitizeCsvCell)
          .join(",");
      }),
    ];

    return new NextResponse(lines.join("\r\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${resolved.ctx.schoolSlug}-guardians.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
