import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { platformService } from "@/server/platform/platform-service";

export const dynamic = "force-dynamic";

const revokeSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "users");
    if (!auth.authorized) return auth.response;

    const url = new URL(req.url);
    const users = await platformService.listGlobalUsers({
      q: url.searchParams.get("q") || undefined,
      role: url.searchParams.get("role") || undefined,
      status: url.searchParams.get("status") || undefined,
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "users:revoke");
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = revokeSchema.parse(body);

    await platformService.revokeUserSessions(
      {
        id: auth.session.user.id,
        name: auth.session.user.name,
        role: auth.session.user.role,
        ipAddress: auth.ipAddress,
        userAgent: auth.userAgent,
      },
      parsed.userId,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
