import "server-only";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { AuthorizationError, NotFoundError, ServiceUnavailableError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type {
  AdmissionDocumentType,
  AdmissionUploadedDocument,
} from "@/modules/school/admissions/types";

const ALLOWED_PHOTO_MIMES = new Set(["image/jpeg", "image/png"]);
const ALLOWED_DOC_MIMES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const MAX_DOC_BYTES = 5 * 1024 * 1024;

const SUPABASE_BUCKET = process.env.ADMISSIONS_STORAGE_BUCKET || "admissions-documents";
const LOCAL_UPLOAD_ROOT = path.join(process.cwd(), ".data", "uploads");

interface StoredUploadObject {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}

const memoryUploads = new Map<string, StoredUploadObject>();

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

function getSupabaseStorageAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey || process.env.NODE_ENV === "test") {
    return null;
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

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

    if (process.env.NODE_ENV === "test") {
      memoryUploads.set(storageKey, {
        buffer,
        mimeType,
        fileName: safeFileName,
      });
    } else {
      const supabase = getSupabaseStorageAdmin();
      let storedInSupabase = false;
      if (supabase) {
        try {
          const { error } = await supabase.storage
            .from(SUPABASE_BUCKET)
            .upload(storageKey, buffer, {
              contentType: mimeType,
              upsert: false,
            });
          if (!error) {
            storedInSupabase = true;
          }
        } catch {
          // Fall back to local runtime storage when bucket is unavailable in dev
        }
      }

      if (!storedInSupabase) {
        try {
          const targetPath = path.join(LOCAL_UPLOAD_ROOT, storageKey);
          fs.mkdirSync(path.dirname(targetPath), { recursive: true });
          fs.writeFileSync(targetPath, buffer);
          fs.writeFileSync(
            `${targetPath}.meta.json`,
            JSON.stringify({ mimeType, fileName: safeFileName }),
            "utf8",
          );
        } catch (fsErr) {
          logger.error(
            {
              event: "ADMISSION_DOCUMENT_LOCAL_WRITE_FAILED",
              schoolId,
              storageKey,
              error: fsErr instanceof Error ? fsErr.message : String(fsErr),
            },
            "[AdmissionsDocumentStorage] Failed writing upload to local disk",
          );
          throw new ServiceUnavailableError(
            "Document storage is temporarily unavailable. Please try again or check storage configuration.",
          );
        }
      }
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

    if (process.env.NODE_ENV === "test") {
      const found = memoryUploads.get(storageKey);
      if (!found) {
        throw new NotFoundError("Admission document");
      }
      return found;
    }

    const supabase = getSupabaseStorageAdmin();
    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from(SUPABASE_BUCKET)
          .download(storageKey);
        if (!error && data) {
          const arrayBuf = await data.arrayBuffer();
          return {
            buffer: Buffer.from(arrayBuf),
            mimeType: data.type || "application/octet-stream",
            fileName: path.basename(storageKey),
          };
        }
      } catch {
        // Fallback to local runtime directory
      }
    }

    const targetPath = path.resolve(LOCAL_UPLOAD_ROOT, storageKey);
    const rootResolved = path.resolve(LOCAL_UPLOAD_ROOT, schoolId);
    if (!targetPath.startsWith(rootResolved) || !fs.existsSync(targetPath)) {
      throw new NotFoundError("Admission document");
    }

    const buffer = fs.readFileSync(targetPath);
    let mimeType = "application/octet-stream";
    let fileName = path.basename(targetPath);
    const metaPath = `${targetPath}.meta.json`;
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, "utf8")) as {
          mimeType?: string;
          fileName?: string;
        };
        if (meta.mimeType) mimeType = meta.mimeType;
        if (meta.fileName) fileName = meta.fileName;
      } catch {
        // ignore corrupted meta
      }
    }

    return { buffer, mimeType, fileName };
  },
};
