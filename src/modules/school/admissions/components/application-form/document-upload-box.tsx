"use client";

import React, { useRef, useState } from "react";
import { Upload, CheckCircle2, Loader2, Trash2, Eye } from "lucide-react";
import type {
  AdmissionDocumentType,
  AdmissionUploadedDocument,
} from "@/modules/school/admissions/types";
import { buildDocumentViewUrl, formatFileSize } from "./wizard-types";

interface DocumentUploadBoxProps {
  schoolSlug: string;
  docType: AdmissionDocumentType;
  label: string;
  hint?: string;
  compactTitle?: string;
  value?: AdmissionUploadedDocument;
  onUploaded: (doc: AdmissionUploadedDocument) => void;
  onRemoved?: () => void;
  onPreview?: (doc: AdmissionUploadedDocument) => void;
}

export function DocumentUploadBox({
  schoolSlug,
  docType,
  label,
  hint = "PDF, JPG, PNG (Max 5MB)",
  compactTitle,
  value,
  onUploaded,
  onRemoved,
  onPreview,
}: DocumentUploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const acceptAttr =
    docType === "student_photo" ? "image/jpeg,image/png" : "application/pdf,image/jpeg,image/png";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", docType);
      formData.append("label", label);

      const res = await fetch(
        `/api/school/admissions/documents?schoolSlug=${encodeURIComponent(schoolSlug)}`,
        {
          method: "POST",
          body: formData,
        },
      );
      const json = await res.json();
      if (!res.ok || !json.success || !json.document) {
        throw new Error(json?.error?.message || "Failed to upload document.");
      }
      onUploaded(json.document as AdmissionUploadedDocument);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        onChange={handleFileChange}
        className="sr-only"
        aria-label={`Upload ${label}`}
      />

      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-[12px] border border-emerald-200 bg-emerald-50/70 px-3 py-2.5 text-xs dark:border-emerald-800/70 dark:bg-emerald-950/35">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            <div className="min-w-0">
              {compactTitle && (
                <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                  {compactTitle}
                </p>
              )}
              <p className="truncate font-bold text-[#08093B] dark:text-[#F3F5FF]">
                {value.fileName}
              </p>
              <p className="text-[10px] text-[#4D5072] dark:text-[#9DA6CC]">
                {formatFileSize(value.sizeBytes)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onPreview ? (
              <button
                type="button"
                onClick={() => onPreview(value)}
                aria-label={`Preview ${label}`}
                className="rounded-[8px] border border-[#D6DBF0] bg-white p-1.5 text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:bg-[#141731] dark:text-[#C5CCF0]"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            ) : (
              <a
                href={buildDocumentViewUrl(schoolSlug, value.storageKey)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Preview ${label}`}
                className="rounded-[8px] border border-[#D6DBF0] bg-white p-1.5 text-[#4D5072] hover:border-[#663CF6] hover:text-[#663CF6] dark:border-[#2E345B] dark:bg-[#141731] dark:text-[#C5CCF0]"
              >
                <Eye className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded-[8px] border border-[#D6DBF0] bg-white px-2 py-1 text-[11px] font-bold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:bg-[#141731] dark:text-[#A78BFA]"
            >
              Replace
            </button>
            {onRemoved && (
              <button
                type="button"
                onClick={onRemoved}
                aria-label={`Remove ${label}`}
                className="rounded-[8px] border border-rose-200 bg-white p-1.5 text-rose-600 hover:bg-rose-50 cursor-pointer dark:border-rose-800/70 dark:bg-[#141731] dark:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-[12px] border border-dashed border-[#BFC7EC] bg-[#FAF8FE] px-4 py-3 text-center transition hover:border-[#663CF6] hover:bg-[#F3EEFF]/60 disabled:opacity-60 cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:hover:border-[#8B5CF6] dark:hover:bg-[#1A1E3E]"
        >
          {compactTitle && (
            <span className="text-[11px] font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              {compactTitle}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F27E8] dark:text-[#C4B5FD]">
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{uploading ? "Uploading..." : "Upload File"}</span>
          </span>
          <span className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">{hint}</span>
        </button>
      )}

      {uploadError && (
        <p role="alert" className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          {uploadError}
        </p>
      )}
    </div>
  );
}
