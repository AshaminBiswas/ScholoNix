import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { studentDossierActionSchema } from "@/modules/students/dossier-schemas";
import { studentDossierService } from "@/server/school/student-dossier-service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ schoolId: string; studentId: string }> },
) {
  try {
    const { schoolId, studentId } = await context.params;
    const auth = await requirePlatformSuperAdmin(
      req,
      `school:${schoolId}:student:${studentId}:dossier:read`,
    );
    if (!auth.authorized) return auth.response;

    const dossier = await studentDossierService.getDossier(
      {
        userId: auth.session.user.id,
        userName: `${auth.session.user.name} (Platform Admin)`,
        role: auth.session.user.role,
        schoolId,
      },
      studentId,
    );
    return NextResponse.json({ success: true, dossier });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ schoolId: string; studentId: string }> },
) {
  try {
    const { schoolId, studentId } = await context.params;
    const auth = await requirePlatformSuperAdmin(
      req,
      `school:${schoolId}:student:${studentId}:dossier:write`,
    );
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = studentDossierActionSchema.parse(body);

    const dossier = await studentDossierService.executeAction(
      {
        userId: auth.session.user.id,
        userName: `${auth.session.user.name} (Platform Admin)`,
        role: auth.session.user.role,
        schoolId,
        ipAddress: auth.ipAddress,
        userAgent: auth.userAgent,
      },
      studentId,
      parsed,
    );
    return NextResponse.json({ success: true, dossier });
  } catch (error) {
    return toErrorResponse(error);
  }
}
