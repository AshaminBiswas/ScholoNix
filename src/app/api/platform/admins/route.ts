import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { platformAdminAuthService } from "@/server/platform/platform-admin-auth";
import {
  createPlatformAdminSchema,
  updatePlatformAdminSchema,
} from "@/modules/platform/schemas";
import { logAuditEvent } from "@/server/security/audit-logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "admins");
    if (!auth.authorized) return auth.response;

    const admins = await platformAdminAuthService.listAdmins();
    return NextResponse.json({ success: true, admins });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "admins:create", {
      allowedRoles: ["SUPER_ADMIN"],
    });
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = createPlatformAdminSchema.parse(body);

    const admin = await platformAdminAuthService.createAdmin(auth.session.user.id, parsed);

    await logAuditEvent({
      schoolId: "platform",
      actorId: auth.session.user.id,
      action: "PLATFORM_TEAM_ADMIN_CREATED",
      entityType: "PlatformAdmin",
      entityId: admin.id,
      details: { email: admin.email, role: admin.role },
      ipAddress: auth.ipAddress,
      userAgent: auth.userAgent,
    });

    return NextResponse.json({ success: true, admin }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "admins:update", {
      allowedRoles: ["SUPER_ADMIN"],
    });
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = updatePlatformAdminSchema.parse(body);

    const admin = await platformAdminAuthService.updateAdmin(auth.session.user.id, parsed);

    await logAuditEvent({
      schoolId: "platform",
      actorId: auth.session.user.id,
      action: "PLATFORM_TEAM_ADMIN_UPDATED",
      entityType: "PlatformAdmin",
      entityId: admin.id,
      details: {
        role: admin.role,
        status: admin.status,
        revokedSessions: Boolean(parsed.revokeSessions),
        passwordReset: Boolean(parsed.newPassword || parsed.forcePasswordReset),
        mfaReset: Boolean(parsed.resetMfa),
      },
      ipAddress: auth.ipAddress,
      userAgent: auth.userAgent,
    });

    return NextResponse.json({ success: true, admin });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "admins:delete", {
      allowedRoles: ["SUPER_ADMIN"],
    });
    if (!auth.authorized) return auth.response;

    const url = new URL(req.url);
    const id = url.searchParams.get("id")?.trim() || "";
    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: "Missing platform admin id." } },
        { status: 400 },
      );
    }

    await platformAdminAuthService.deleteAdmin(auth.session.user.id, id);

    await logAuditEvent({
      schoolId: "platform",
      actorId: auth.session.user.id,
      action: "PLATFORM_TEAM_ADMIN_DELETED",
      entityType: "PlatformAdmin",
      entityId: id,
      ipAddress: auth.ipAddress,
      userAgent: auth.userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
