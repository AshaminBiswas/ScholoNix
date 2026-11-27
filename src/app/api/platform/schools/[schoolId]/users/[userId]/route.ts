import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { platformService } from "@/server/platform/platform-service";
import { updatePlatformSchoolUserSchema } from "@/modules/platform/schemas";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ schoolId: string; userId: string }> },
) {
  try {
    const { schoolId, userId } = await context.params;
    const auth = await requirePlatformSuperAdmin(req, `school:${schoolId}:user:${userId}`);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = updatePlatformSchoolUserSchema.parse(body);

    const user = await platformService.updateSchoolUser(
      {
        id: auth.session.user.id,
        name: auth.session.user.name,
        role: auth.session.user.role,
        ipAddress: auth.ipAddress,
        userAgent: auth.userAgent,
      },
      schoolId,
      userId,
      parsed,
    );

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return toErrorResponse(error);
  }
}
