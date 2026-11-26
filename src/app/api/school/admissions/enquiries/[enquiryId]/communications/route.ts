import { NextRequest, NextResponse } from "next/server";
import { ValidationError, toErrorResponse } from "@/lib/errors";
import { createEnquiryCommunicationSchema } from "@/modules/school/admissions/schemas";
import type { EnquiryCommunicationAttachment } from "@/modules/school/admissions/types";
import { admissionsDocumentStorage } from "@/server/school/admissions-document-storage";
import { admissionsService } from "@/server/school/admissions-service";
import { resolveApiTenantActor } from "@/server/school/resolve-api-tenant";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ enquiryId: string }> },
) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const { enquiryId } = await context.params;
    // Verify enquiry belongs to the caller's tenant first
    await admissionsService.getEnquiryDossier(resolved.ctx, enquiryId);

    const url = new URL(req.url);
    const storageKey = url.searchParams.get("storageKey")?.trim();
    if (!storageKey) {
      throw new ValidationError("storageKey query parameter is required.");
    }

    const signedUrl = await admissionsDocumentStorage.getSignedDocumentUrl(
      resolved.ctx.schoolId,
      storageKey,
      { expiresInSeconds: 120 },
    );
    if (signedUrl) {
      return NextResponse.redirect(signedUrl, { status: 302 });
    }

    const obj = await admissionsDocumentStorage.readDocument(resolved.ctx.schoolId, storageKey);
    return new NextResponse(new Uint8Array(obj.buffer), {
      status: 200,
      headers: {
        "Content-Type": obj.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${obj.fileName.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ enquiryId: string }> },
) {
  try {
    const resolved = await resolveApiTenantActor(req);
    if ("response" in resolved) return resolved.response;

    const { enquiryId } = await context.params;
    const contentType = req.headers.get("content-type") || "";
    let payload: Record<string, unknown> = {};
    const attachments: EnquiryCommunicationAttachment[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      payload = {
        channel: formData.get("channel"),
        recipient: formData.get("recipient"),
        cc: formData.get("cc") || "",
        bcc: formData.get("bcc") || "",
        subject: formData.get("subject"),
        message: formData.get("message"),
      };

      const uploadedFiles = formData.getAll("files");
      if (uploadedFiles.length > 5) {
        throw new ValidationError("At most 5 attachments can be uploaded per communication.");
      }
      // Verify enquiry ownership before writing any file into object storage
      await admissionsService.getEnquiryDossier(resolved.ctx, enquiryId);

      for (const entry of uploadedFiles) {
        if (entry && typeof entry === "object" && "arrayBuffer" in entry) {
          const file = entry as File;
          const arrayBuffer = await file.arrayBuffer();
          const uploaded = await admissionsDocumentStorage.uploadEnquiryAttachment(
            resolved.ctx.schoolId,
            enquiryId,
            {
              buffer: Buffer.from(arrayBuffer),
              mimeType: file.type,
              fileName: file.name,
            },
          );
          attachments.push(uploaded);
        }
      }
    } else {
      payload = (await req.json()) as Record<string, unknown>;
    }

    const parsed = createEnquiryCommunicationSchema.parse(payload);
    const communication = await admissionsService.sendEnquiryCommunication(
      resolved.ctx,
      enquiryId,
      {
        ...parsed,
        attachments,
      },
    );

    return NextResponse.json({ success: true, communication }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
