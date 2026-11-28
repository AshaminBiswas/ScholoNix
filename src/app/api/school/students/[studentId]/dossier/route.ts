import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { studentDossierActionSchema } from "@/modules/students/dossier-schemas";
import { studentDossierService } from "@/server/school/student-dossier-service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ studentId: string }> },
) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;
    const { studentId } = await context.params;

    const dossier = await studentDossierService.getDossier(resolved.ctx, studentId);
    return NextResponse.json({ success: true, dossier });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ studentId: string }> },
) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;
    const { studentId } = await context.params;

    const body = await req.json();
    const parsed = studentDossierActionSchema.parse(body);

    const dossier = await studentDossierService.executeAction(
      resolved.ctx,
      studentId,
      parsed,
    );
    return NextResponse.json({ success: true, dossier });
  } catch (error) {
    return toErrorResponse(error);
  }
}
