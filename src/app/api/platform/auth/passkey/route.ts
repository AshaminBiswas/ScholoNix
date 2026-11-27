import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { logAuditEvent } from "@/server/security/audit-logger";
import {
  isPlatformAdminFullyVerified,
  platformAdminAuthService,
} from "@/server/platform/platform-admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionCtx = await platformAdminAuthService.getSessionFromRequest(req);
    if (!sessionCtx) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
        { status: 401 },
      );
    }
    const passkeys = await platformAdminAuthService.listPasskeys(sessionCtx.admin.id);
    return NextResponse.json({ success: true, passkeys });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionCtx = await platformAdminAuthService.getSessionFromRequest(req);
    if (!sessionCtx) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
        { status: 401 },
      );
    }
    if (!isPlatformAdminFullyVerified(sessionCtx.admin, sessionCtx.mfaVerified)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ADMIN_SETUP_REQUIRED",
            message: "Complete security verification before removing passkeys.",
          },
        },
        { status: 403 },
      );
    }

    const id = new URL(req.url).searchParams.get("id")?.trim() || "";
    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: "Missing passkey id." } },
        { status: 400 },
      );
    }

    await platformAdminAuthService.deletePasskey(sessionCtx.admin.id, id);

    await logAuditEvent({
      schoolId: "platform",
      actorId: sessionCtx.admin.id,
      action: "PLATFORM_ADMIN_PASSKEY_DELETED",
      entityType: "PlatformAdminPasskey",
      entityId: id,
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
