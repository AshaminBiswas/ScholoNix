import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { platformService } from "@/server/platform/platform-service";
import { updateSupportTicketSchema } from "@/modules/platform/schemas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "support");
    if (!auth.authorized) return auth.response;

    const url = new URL(req.url);
    const tickets = await platformService.listSupportTickets(
      url.searchParams.get("status") || undefined,
    );

    return NextResponse.json({ success: true, tickets });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "support:update");
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = updateSupportTicketSchema.parse(body);

    const ticket = await platformService.updateSupportTicket(
      {
        id: auth.session.user.id,
        name: auth.session.user.name,
        role: auth.session.user.role,
        ipAddress: auth.ipAddress,
        userAgent: auth.userAgent,
      },
      parsed,
    );

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    return toErrorResponse(error);
  }
}
