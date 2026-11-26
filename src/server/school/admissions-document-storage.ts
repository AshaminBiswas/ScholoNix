import "server-only";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  AuthorizationError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from "@/lib/errors";
import { logger } from "@/lib/logger";
import type {
  AdmissionDocumentType,
  AdmissionUploadedDocument,
  EnquiryCommunicationAttachment,
} from "@/modules/school/admissions/types";
import { createLocalStorageAdapter } from "@/server/storage/local-adapter";
import {
  getObjectStorageAdapter,
  type SignedUrlOptions,
} from "@/server/storage/storage-registry";

const ALLOWED_PHOTO_MIMES = new Set(["image/jpeg", "image/png"]);
const ALLOWED_DOC_MIMES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const MAX_DOC_BYTES = 5 * 1024 * 1024;

export interface StoredUploadObject {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  versionTag?: string;
}

const DOC_TYPE_LABELS: Record<AdmissionDocumentType, string> = {
  student_photo: "Student Photograph",
  father_aadhaar: "Father's Aadhaar Card",
  mother_aadhaar: "Mother's Aadhaar Card",
  birth_certificate: "Birth Certificate",
  student_aadhaar: "Student's Aadhaar Card",
  last_marksheet: "Last Passing Marksheet",
};

function sanitizeFileName(rawName: string): string {
  const base = path.basename(rawName || "document").replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.slice(0, 120) || "document";
}

function getExtensionForMime(mimeType: string): string {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  return "pdf";
}

function normalizeDeclaredMime(rawMimeType: string, fileName: string): string {
  const normalized = rawMimeType.split(";")[0]?.trim().toLowerCase() || "";
  if (normalized === "image/jpg" || normalized === "image/pjpeg") return "image/jpeg";
  if (normalized === "image/x-png") return "image/png";
  if (normalized === "application/x-pdf") return "application/pdf";
  if (!normalized || normalized === "application/octet-stream") {
    const ext = path.extname(fileName || "").toLowerCase();
    if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
    if (ext === ".png") return "image/png";
    if (ext === ".pdf") return "application/pdf";
  }
  return normalized;
}

function matchesMagicBytes(buf: Buffer, mimeType: string): boolean {
  if (buf.length < 4) return false;
  if (mimeType === "image/jpeg") {
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return (
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a
    );
  }
  if (mimeType === "application/pdf") {
    return buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46; // %PDF
  }
  return false;
}

/** Validates that a storageKey belongs strictly to the requesting school tenant. */
export function assertTenantDocumentStorageKey(schoolId: string, storageKey: string): void {
  const normalized = storageKey.replace(/\\/g, "/");
  if (
    !normalized ||
    normalized.includes("..") ||
    !normalized.startsWith(`${schoolId}/admissions/`)
  ) {
    throw new AuthorizationError("Access denied: document belongs to another tenant or is invalid.");
  }
}

function buildPdfStorageKey(schoolId: string, applicationId: string): {
  cleanAppId: string;
  storageKey: string;
} {
  const cleanAppId = applicationId.replace(/[^a-zA-Z0-9_-]/g, "");
  const storageKey = `${schoolId}/admissions/pdf/${cleanAppId}.pdf`;
  assertTenantDocumentStorageKey(schoolId, storageKey);
  return { cleanAppId, storageKey };
}

export const admissionsDocumentStorage = {
  validateAndSaveDocument: async (params: {
    schoolId: string;
    docType: AdmissionDocumentType;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
    label?: string;
  }): Promise<AdmissionUploadedDocument> => {
    const { schoolId, docType, buffer } = params;
    const mimeType = normalizeDeclaredMime(params.mimeType, params.fileName);
    const isPhoto = docType === "student_photo";
    const allowedMimes = isPhoto ? ALLOWED_PHOTO_MIMES : ALLOWED_DOC_MIMES;
    const maxBytes = isPhoto ? MAX_PHOTO_BYTES : MAX_DOC_BYTES;

    if (!allowedMimes.has(mimeType)) {
      throw new ValidationError(
        isPhoto
          ? "Student photo must be a JPG or PNG image."
          : "Document must be a PDF, JPG, or PNG file.",
      );
    }

    if (buffer.length === 0 || buffer.length > maxBytes) {
      throw new ValidationError(
        isPhoto
          ? "Student photo must be 2 MB or smaller."
          : "Document size must be 5 MB or smaller.",
      );
    }

    if (!matchesMagicBytes(buffer, mimeType)) {
      throw new ValidationError("File contents do not match the declared file type.");
    }

    const safeFileName = sanitizeFileName(params.fileName);
    const ext = getExtensionForMime(mimeType);
    const objectId = randomUUID();
    const storageKey = `${schoolId}/admissions/${objectId}.${ext}`;
    const resolvedLabel = params.label?.trim() || DOC_TYPE_LABELS[docType];

    const adapter = getObjectStorageAdapter();
    try {
      await adapter.putObject({
        storageKey,
        buffer,
        mimeType,
        fileName: safeFileName,
        isPrivate: true,
        overwrite: false,
        tags: [`school:${schoolId}`, `doc:${docType}`],
      });
    } catch (storageErr) {
      logger.error(
        {
          event: "ADMISSION_DOCUMENT_STORE_FAILED",
          provider: adapter.provider,
          schoolId,
          storageKey,
          error: storageErr instanceof Error ? storageErr.message : String(storageErr),
        },
        "[AdmissionsDocumentStorage] Failed storing uploaded document",
      );
      throw new ServiceUnavailableError(
        "Document storage is temporarily unavailable. Please try again or check storage configuration.",
      );
    }

    return {
      key: objectId,
      docType,
      label: resolvedLabel,
      fileName: safeFileName,
      mimeType,
      sizeBytes: buffer.length,
      storageKey,
      uploadedAt: new Date().toISOString(),
    };
  },

  readDocument: async (
    schoolId: string,
    storageKey: string,
  ): Promise<StoredUploadObject> => {
    assertTenantDocumentStorageKey(schoolId, storageKey);
    const adapter = getObjectStorageAdapter();
    const found = await adapter.getObject(storageKey);
    if (found) {
      return {
        buffer: found.buffer,
        mimeType: found.mimeType,
        fileName: found.fileName,
        versionTag: found.versionTag,
      };
    }

    // Legacy transition fallback: inspect local disk in non-test environments if primary is cloud
    if (process.env.NODE_ENV !== "test" && adapter.provider !== "local") {
      const legacyLocal = await createLocalStorageAdapter().getObject(storageKey);
      if (legacyLocal) {
        return {
          buffer: legacyLocal.buffer,
          mimeType: legacyLocal.mimeType,
          fileName: legacyLocal.fileName,
          versionTag: legacyLocal.versionTag,
        };
      }
    }

    throw new NotFoundError("Admission document");
  },

  readDocumentIfExists: async (
    schoolId: string,
    storageKey: string,
  ): Promise<StoredUploadObject | null> => {
    try {
      return await admissionsDocumentStorage.readDocument(schoolId, storageKey);
    } catch {
      return null;
    }
  },

  getSignedDocumentUrl: async (
    schoolId: string,
    storageKey: string,
    options?: SignedUrlOptions,
  ): Promise<string | null> => {
    assertTenantDocumentStorageKey(schoolId, storageKey);
    const adapter = getObjectStorageAdapter();
    if (!adapter.getSignedUrl) return null;
    return adapter.getSignedUrl(storageKey, options);
  },

  saveGeneratedPdf: async (
    schoolId: string,
    applicationId: string,
    buffer: Buffer,
    versionTag?: string,
  ): Promise<string> => {
    const { cleanAppId, storageKey } = buildPdfStorageKey(schoolId, applicationId);
    const adapter = getObjectStorageAdapter();

    try {
      await adapter.putObject({
        storageKey,
        buffer,
        mimeType: "application/pdf",
        fileName: `${cleanAppId}.pdf`,
        isPrivate: true,
        overwrite: true,
        versionTag,
        tags: [`school:${schoolId}`, "doc:application_pdf"],
      });
      return storageKey;
    } catch (storageErr) {
      logger.error(
        {
          event: "ADMISSION_PDF_STORE_FAILED",
          provider: adapter.provider,
          schoolId,
          storageKey,
          error: storageErr instanceof Error ? storageErr.message : String(storageErr),
        },
        "[AdmissionsDocumentStorage] Failed storing generated PDF",
      );
      throw new ServiceUnavailableError("Generated PDF storage is temporarily unavailable.");
    }
  },

  readGeneratedPdf: async (
    schoolId: string,
    applicationId: string,
  ): Promise<StoredUploadObject | null> => {
    const { storageKey } = buildPdfStorageKey(schoolId, applicationId);
    const adapter = getObjectStorageAdapter();

    try {
      const found = await adapter.getObject(storageKey);
      if (found) {
        return {
          buffer: found.buffer,
          mimeType: found.mimeType || "application/pdf",
          fileName: found.fileName,
          versionTag: found.versionTag,
        };
      }
    } catch {
      // Regenerate seamlessly on demand if remote lookup fails
    }

    if (process.env.NODE_ENV !== "test" && adapter.provider !== "local") {
      try {
        const legacyLocal = await createLocalStorageAdapter().getObject(storageKey);
        if (legacyLocal) {
          return {
            buffer: legacyLocal.buffer,
            mimeType: legacyLocal.mimeType || "application/pdf",
            fileName: legacyLocal.fileName,
            versionTag: legacyLocal.versionTag,
          };
        }
      } catch {
        // Ignore legacy fallback read errors
      }
    }

    return null;
  },

  getSignedPdfUrl: async (
    schoolId: string,
    applicationId: string,
    options?: SignedUrlOptions,
  ): Promise<string | null> => {
    const { storageKey } = buildPdfStorageKey(schoolId, applicationId);
    const adapter = getObjectStorageAdapter();
    if (!adapter.getSignedUrl) return null;
    return adapter.getSignedUrl(storageKey, options);
  },

  uploadEnquiryAttachment: async (
    schoolId: string,
    enquiryId: string,
    file: { buffer: Buffer; mimeType: string; fileName: string },
  ): Promise<EnquiryCommunicationAttachment> => {
    const cleanSchool = schoolId.replace(/[^a-zA-Z0-9_-]/g, "");
    const cleanEnquiry = enquiryId.replace(/[^a-zA-Z0-9_-]/g, "");
    const safeName = sanitizeFileName(file.fileName);
    const mimeType = normalizeDeclaredMime(file.mimeType, safeName);

    if (!ALLOWED_DOC_MIMES.has(mimeType)) {
      throw new ValidationError("Unsupported file type. Only PDF, JPG, and PNG files are allowed.");
    }
    if (file.buffer.length === 0 || file.buffer.length > MAX_DOC_BYTES) {
      throw new ValidationError("Attachment size must be between 1 byte and 5 MB.");
    }
    if (!matchesMagicBytes(file.buffer, mimeType)) {
      throw new ValidationError("File content does not match declared PDF/JPG/PNG format.");
    }

    const ext = getExtensionForMime(mimeType);
    const uniqueKey = randomUUID();
    const storageKey = `${cleanSchool}/admissions/enquiries/${cleanEnquiry}/${uniqueKey}.${ext}`;
    assertTenantDocumentStorageKey(schoolId, storageKey);

    const adapter = getObjectStorageAdapter();
    try {
      await adapter.putObject({
        storageKey,
        buffer: file.buffer,
        mimeType,
        fileName: safeName,
        isPrivate: true,
        overwrite: false,
        tags: [`school:${schoolId}`, "doc:enquiry_attachment"],
      });
    } catch (storageErr) {
      logger.error(
        {
          event: "ENQUIRY_ATTACHMENT_UPLOAD_FAILED",
          provider: adapter.provider,
          schoolId,
          storageKey,
          error: storageErr instanceof Error ? storageErr.message : String(storageErr),
        },
        "[AdmissionsDocumentStorage] Failed storing enquiry attachment",
      );
      throw new ServiceUnavailableError("Attachment storage is temporarily unavailable.");
    }

    return {
      key: uniqueKey,
      fileName: safeName,
      mimeType,
      sizeBytes: file.buffer.length,
      storageKey,
      uploadedAt: new Date().toISOString(),
    };
  },
};
