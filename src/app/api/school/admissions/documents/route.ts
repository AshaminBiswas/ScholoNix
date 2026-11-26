import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorize } from "@/server/authorization/permissions";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";
import { admissionsDocumentStorage } from "@/server/school/admissions-document-storage";
import { logAuditEvent } from "@/server/security/audit-logger";
import { toErrorResponse, ValidationError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const docTypeSchema = z.enum([
  "student_photo",
  "father_aadhaar",
  "mother_aadhaar",
  "birth_certificate",
  "student_aadhaar",
  "last_marksheet",
]);

export async function POST(req: NextRequest) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const { ctx } = resolved;
    authorize({ id: ctx.userId, role: ctx.role, schoolId: ctx.schoolId }, "admissions:write");

    const formData = await req.formData();
    const file = formData.get("file");
    const docTypeRaw = formData.get("docType");
    const labelRaw = formData.get("label");

    if (!(file instanceof File)) {
      throw new ValidationError("Please select a file to upload.");
    }

    const docType = docTypeSchema.parse(docTypeRaw);
    const label = typeof labelRaw === "string" ? labelRaw.slice(0, 120) : undefined;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const document = await admissionsDocumentStorage.validateAndSaveDocument({
      schoolId: ctx.schoolId,
      docType,
      fileName: file.name,
      mimeType: file.type,
      buffer,
      label,
    });

    await logAuditEvent({
      schoolId: ctx.schoolId,
      actorId: ctx.userId,
      action: "ADMISSION_DOCUMENT_UPLOADED",
      entityType: "AdmissionDocument",
      entityId: document.key,
      details: {
        docType: document.docType,
        sizeBytes: document.sizeBytes,
        mimeType: document.mimeType,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return NextResponse.json({ success: true, document }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
