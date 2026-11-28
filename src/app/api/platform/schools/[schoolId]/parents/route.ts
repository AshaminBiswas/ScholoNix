import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { parentService } from "@/server/school/parent-service";
import { parseParentFiltersFromUrl } from "@/modules/parents/analytics";
import { portalInviteSchema } from "@/modules/parents/schemas";

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
    const auth = await requirePlatformSuperAdmin(req, `school:${schoolId}:parents:read`);
    if (!auth.authorized) return auth.response;

    const filters = parseParentFiltersFromUrl(new URL(req.url));
    const data = await parentService.getDashboardData(buildPlatformActor(auth, schoolId), filters);
    return NextResponse.json({ success: true, ...data });
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
    const auth = await requirePlatformSuperAdmin(req, `school:${schoolId}:parents:portal`);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = portalInviteSchema.parse(body);
    const result = await parentService.updatePortalAccess(
      buildPlatformActor(auth, schoolId),
      parsed.guardianIds ?? [],
      parsed.action,
    );
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
