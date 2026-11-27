import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { platformService } from "@/server/platform/platform-service";
import { createPlatformSchoolUserSchema } from "@/modules/platform/schemas";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ schoolId: string }> },
) {
  try {
    const { schoolId } = await context.params;
    const auth = await requirePlatformSuperAdmin(req, `school:${schoolId}:users`);
    if (!auth.authorized) return auth.response;

    const users = await platformService.listSchoolUsers(schoolId);
    return NextResponse.json({ success: true, users });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ schoolId: string }> },
) {
  try {
    const { schoolId } = await context.params;
    const auth = await requirePlatformSuperAdmin(req, `school:${schoolId}:users:create`);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = createPlatformSchoolUserSchema.parse(body);

    const user = await platformService.createSchoolUser(
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

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
