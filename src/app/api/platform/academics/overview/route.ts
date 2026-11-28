import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { platformService } from "@/server/platform/platform-service";
import { academicsRepository } from "@/server/school/academics-repository";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "academics:global:overview");
    if (!auth.authorized) return auth.response;

    const schools = await platformService.listSchools();
    const snapshots = await Promise.all(
      schools.map(async (entry) => {
        try {
          const snap = await academicsRepository.getSnapshot(entry.school.id, {
            asPlatformAdmin: true,
          });
          return {
            schoolId: entry.school.id,
            schoolName: entry.school.name,
            schoolUniqueId: entry.school.uniqueId ?? null,
            activeAcademicYear: snap.activeAcademicYear,
            totalClasses: snap.kpis.totalClasses,
            totalSections: snap.kpis.totalSections,
            totalSubjects: snap.kpis.totalSubjects,
            totalStudents: snap.kpis.totalStudents,
            totalLinkedGuardians: snap.kpis.totalLinkedGuardians,
          };
        } catch {
          return {
            schoolId: entry.school.id,
            schoolName: entry.school.name,
            schoolUniqueId: entry.school.uniqueId ?? null,
            activeAcademicYear: "—",
            totalClasses: 0,
            totalSections: 0,
            totalSubjects: 0,
            totalStudents: 0,
            totalLinkedGuardians: 0,
          };
        }
      }),
    );

    const kpis = snapshots.reduce(
      (acc, row) => ({
        totalSchools: acc.totalSchools + 1,
        totalClasses: acc.totalClasses + row.totalClasses,
        totalSections: acc.totalSections + row.totalSections,
        totalSubjects: acc.totalSubjects + row.totalSubjects,
        totalStudents: acc.totalStudents + row.totalStudents,
        totalLinkedGuardians: acc.totalLinkedGuardians + row.totalLinkedGuardians,
      }),
      {
        totalSchools: 0,
        totalClasses: 0,
        totalSections: 0,
        totalSubjects: 0,
        totalStudents: 0,
        totalLinkedGuardians: 0,
      },
    );

    return NextResponse.json({
      success: true,
      data: { kpis, schoolSummaries: snapshots },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
