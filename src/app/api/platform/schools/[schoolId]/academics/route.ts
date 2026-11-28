import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { academicsService } from "@/server/school/academics-service";
import { academicMutationSchema } from "@/modules/academics/schemas";

export const dynamic = "force-dynamic";

function buildPlatformActor(
  auth: Extract<Awaited<ReturnType<typeof requirePlatformSuperAdmin>>, { authorized: true }>,
  schoolId: string,
) {
  return {
    userId: auth.session.user.id,
    userName: `${auth.session.user.name} (Platform Admin)`,
    role: auth.session.user.role,
    schoolId,
    schoolSlug: schoolId,
    schoolName: "Platform Governance",
    ipAddress: auth.ipAddress,
    userAgent: auth.userAgent,
  };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ schoolId: string }> },
) {
  try {
    const { schoolId } = await context.params;
    const auth = await requirePlatformSuperAdmin(req, `school:${schoolId}:academics:read`);
    if (!auth.authorized) return auth.response;

    const url = new URL(req.url);
    const academicYear = url.searchParams.get("academicYear")?.trim() || undefined;
    const snapshot = await academicsService.getWorkspace(
      buildPlatformActor(auth, schoolId),
      academicYear,
    );
    return NextResponse.json({ success: true, snapshot });
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
    const auth = await requirePlatformSuperAdmin(req, `school:${schoolId}:academics:write`);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = academicMutationSchema.parse(body);
    const snapshot = await academicsService.mutate(buildPlatformActor(auth, schoolId), parsed);
    return NextResponse.json({ success: true, snapshot });
  } catch (error) {
    return toErrorResponse(error);
  }
}
