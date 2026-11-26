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
    const wantsRedirect = url.searchParams.get("delivery") === "redirect";

    const { buffer, filename, pageCount, signedUrl } = await admissionsService.getApplicationPdf(
      resolved.ctx,
      applicationId,
    );

    if (wantsRedirect && signedUrl) {
      const redirectUrl = new URL(signedUrl);
      if (!isInline) {
        redirectUrl.searchParams.set("ik-attachment", "true");
      }
      return NextResponse.redirect(redirectUrl.toString(), {
        status: 302,
        headers: {
          "Cache-Control": "private, no-store",
        },
      });
    }

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
