import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { platformService } from "@/server/platform/platform-service";
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from "@/modules/platform/schemas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "announcements");
    if (!auth.authorized) return auth.response;

    const announcements = await platformService.listAnnouncements();
    return NextResponse.json({ success: true, announcements });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "announcements:create");
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = createAnnouncementSchema.parse(body);

    const announcement = await platformService.createAnnouncement(
      {
        id: auth.session.user.id,
        name: auth.session.user.name,
        role: auth.session.user.role,
        ipAddress: auth.ipAddress,
        userAgent: auth.userAgent,
      },
      parsed,
    );

    return NextResponse.json({ success: true, announcement }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "announcements:update");
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = updateAnnouncementSchema.parse(body);

    const announcement = await platformService.updateAnnouncement(
      {
        id: auth.session.user.id,
        name: auth.session.user.name,
        role: auth.session.user.role,
        ipAddress: auth.ipAddress,
        userAgent: auth.userAgent,
      },
      parsed,
    );

    return NextResponse.json({ success: true, announcement });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "announcements:delete");
    if (!auth.authorized) return auth.response;

    const url = new URL(req.url);
    const id = url.searchParams.get("id")?.trim() || "";
    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: "Missing announcement id" } },
        { status: 400 },
      );
    }

    await platformService.deleteAnnouncement(
      {
        id: auth.session.user.id,
        name: auth.session.user.name,
        role: auth.session.user.role,
        ipAddress: auth.ipAddress,
        userAgent: auth.userAgent,
      },
      id,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
