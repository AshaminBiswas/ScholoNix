import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { platformService } from "@/server/platform/platform-service";
import { platformSchoolDataPatchSchema } from "@/modules/platform/schemas";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ schoolId: string }> },
) {
  try {
    const { schoolId } = await context.params;
    const auth = await requirePlatformSuperAdmin(req, `school:${schoolId}:data`);
    if (!auth.authorized) return auth.response;

    const data = await platformService.inspectSchoolData(
      {
        id: auth.session.user.id,
        name: auth.session.user.name,
        role: auth.session.user.role,
        ipAddress: auth.ipAddress,
        userAgent: auth.userAgent,
      },
      schoolId,
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ schoolId: string }> },
) {
  try {
    const { schoolId } = await context.params;
    const auth = await requirePlatformSuperAdmin(req, `school:${schoolId}:data:patch`);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = platformSchoolDataPatchSchema.parse(body);

    const result = await platformService.patchSchoolData(
      {
        id: auth.session.user.id,
        name: auth.session.user.name,
        role: auth.session.user.role,
        ipAddress: auth.ipAddress,
        userAgent: auth.userAgent,
      },
      schoolId,
      parsed,
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
