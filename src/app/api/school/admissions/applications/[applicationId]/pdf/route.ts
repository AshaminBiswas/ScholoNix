import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { admissionsService } from "@/server/school/admissions-service";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ applicationId: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const { applicationId } = await context.params;
    const url = new URL(req.url);
    const isInline = url.searchParams.get("disposition") === "inline";

    const { buffer, filename, pageCount } = await admissionsService.getApplicationPdf(
      resolved.ctx,
      applicationId,
    );

    const safeName = filename.replace(/["\r\n]/g, "_");
    const disposition = isInline ? "inline" : "attachment";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${safeName}"`,
        "Content-Length": String(buffer.length),
        "X-Content-Type-Options": "nosniff",
        "X-PDF-Pages": String(pageCount),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
