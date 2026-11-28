import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { platformService } from "@/server/platform/platform-service";
import { parentRepository } from "@/server/school/parent-repository";
import { computeParentAnalytics } from "@/modules/parents/analytics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "parents:global:overview");
    if (!auth.authorized) return auth.response;

    const schools = await platformService.listSchools();
    const summaries = await Promise.all(
      schools.map(async (entry) => {
        try {
          const snap = await parentRepository.getSnapshot(entry.school.id, {
            asPlatformAdmin: true,
          });
          const analytics = computeParentAnalytics(snap.guardians, snap.grades);
          return {
            schoolId: entry.school.id,
            schoolName: entry.school.name,
            schoolUniqueId: entry.school.uniqueId ?? null,
            totalGuardians: analytics.kpis.totalGuardians,
            linkedHouseholds: analytics.kpis.linkedHouseholds,
            multiChildFamilies: analytics.kpis.multiChildFamilies,
            portalActivated: analytics.kpis.portalActivated,
            portalActivationPct: analytics.kpis.portalActivationPct,
            restrictedContactsCount: analytics.kpis.restrictedContactsCount,
          };
        } catch {
          return {
            schoolId: entry.school.id,
            schoolName: entry.school.name,
            schoolUniqueId: entry.school.uniqueId ?? null,
            totalGuardians: 0,
            linkedHouseholds: 0,
            multiChildFamilies: 0,
            portalActivated: 0,
            portalActivationPct: 0,
            restrictedContactsCount: 0,
          };
        }
      }),
    );

    const kpis = summaries.reduce(
      (acc, row) => ({
        totalSchools: acc.totalSchools + 1,
        totalGuardians: acc.totalGuardians + row.totalGuardians,
        multiChildFamilies: acc.multiChildFamilies + row.multiChildFamilies,
        portalActivated: acc.portalActivated + row.portalActivated,
        restrictedContactsCount: acc.restrictedContactsCount + row.restrictedContactsCount,
      }),
      {
        totalSchools: 0,
        totalGuardians: 0,
        multiChildFamilies: 0,
        portalActivated: 0,
        restrictedContactsCount: 0,
      },
    );

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          ...kpis,
          portalActivationPct:
            kpis.totalGuardians > 0
              ? Math.round((kpis.portalActivated / kpis.totalGuardians) * 100)
              : 0,
        },
        schoolSummaries: summaries,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
