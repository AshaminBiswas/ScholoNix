import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/server/authorization/permissions";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { admissionsDocumentStorage } from "@/server/school/admissions-document-storage";
import { toErrorResponse, ValidationError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const { ctx } = resolved;
    authorize({ id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId }, "admissions:read");

    const url = new URL(req.url);
    const storageKey = url.searchParams.get("key")?.trim();
    if (!storageKey) {
      throw new ValidationError("Document key is required.");
    }

    const doc = await admissionsDocumentStorage.readDocument(ctx.schoolId, storageKey);
    const safeName = doc.fileName.replace(/["\r\n]/g, "_");

    return new NextResponse(new Uint8Array(doc.buffer), {
      status: 200,
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `inline; filename="${safeName}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
