import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requirePlatformSuperAdmin } from "@/server/platform/require-platform-admin";
import { platformService } from "@/server/platform/platform-service";
import {
  createPlatformInvoiceSchema,
  updatePlatformInvoiceSchema,
} from "@/modules/platform/schemas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "billing");
    if (!auth.authorized) return auth.response;

    const url = new URL(req.url);
    const invoices = await platformService.listInvoices({
      schoolId: url.searchParams.get("schoolId") || undefined,
      status: url.searchParams.get("status") || undefined,
    });

    return NextResponse.json({ success: true, invoices });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "billing:create");
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = createPlatformInvoiceSchema.parse(body);

    const invoice = await platformService.createInvoice(
      {
        id: auth.session.user.id,
        name: auth.session.user.name,
        role: auth.session.user.role,
        ipAddress: auth.ipAddress,
        userAgent: auth.userAgent,
      },
      parsed,
    );

    return NextResponse.json({ success: true, invoice }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requirePlatformSuperAdmin(req, "billing:update");
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = updatePlatformInvoiceSchema.parse(body);

    const invoice = await platformService.updateInvoice(
      {
        id: auth.session.user.id,
        name: auth.session.user.name,
        role: auth.session.user.role,
        ipAddress: auth.ipAddress,
        userAgent: auth.userAgent,
      },
      parsed,
    );

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    return toErrorResponse(error);
  }
}
