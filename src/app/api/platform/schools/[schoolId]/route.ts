import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { platformService } from "@/server/platform/platform-service";
import { updatePlatformSchoolSchema } from "@/modules/platform/schemas";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ schoolId: string }> },
) {
  try {
    const { schoolId } = await context.params;
    const auth = await requirePlatformSuperAdmin(req, `school:${schoolId}`);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = updatePlatformSchoolSchema.parse(body);

    const school = await platformService.updateSchool(
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

    return NextResponse.json({ success: true, school });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ schoolId: string }> },
) {
  try {
    const { schoolId } = await context.params;
    const auth = await requirePlatformSuperAdmin(req, `school:${schoolId}:delete`);
    if (!auth.authorized) return auth.response;

    await platformService.deleteSchool(
      {
        id: auth.session.user.id,
        name: auth.session.user.name,
        role: auth.session.user.role,
        ipAddress: auth.ipAddress,
        userAgent: auth.userAgent,
      },
      schoolId,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
