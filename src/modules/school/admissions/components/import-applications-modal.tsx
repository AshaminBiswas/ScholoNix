"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Upload, Download, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet } from "lucide-react";
import type { CreateApplicationInput } from "@/modules/school/admissions/schemas";

interface ImportApplicationsModalProps {
  open: boolean;
  onClose: () => void;
  defaultAcademicYear: string;
  availableGrades: string[];
  onImport: (applications: CreateApplicationInput[]) => Promise<void>;
}

const SAMPLE_IMPORT_CSV = [
  "Student Name,Grade Applied,Academic Year,Guardian Name,Guardian Phone,Guardian Email,Gender,Date of Birth,Previous School,Status",
  "Synthetic Applicant One,Class I,2026 – 2027,Synthetic Guardian One,+919000000001,guardian.one@example.com,Male,2019-05-12,Example Prep School,UNDER_REVIEW",
  "Synthetic Applicant Two,Class III,2026 – 2027,Synthetic Guardian Two,+919000000002,guardian.two@example.com,Female,2017-08-22,Sample Primary Academy,SHORTLISTED",
].join("\n");

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function normalizeHeaderKey(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseApplicationsCsv(
  rawCsv: string,
  defaultAcademicYear: string,
  fallbackGrade: string,
): { valid: CreateApplicationInput[]; errors: string[] } {
  const lines = rawCsv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { valid: [], errors: ["Provide a CSV header row plus at least one data row."] };
  }

  const headers = parseCsvLine(lines[0]!).map(normalizeHeaderKey);
  const colIndex = (candidates: string[]) =>
    headers.findIndex((h) => candidates.includes(h));

  const idxStudent = colIndex(["studentname", "student", "name", "applicantname"]);
  const idxGrade = colIndex(["gradeapplied", "grade", "class"]);
  const idxAy = colIndex(["academicyear", "year", "session"]);
  const idxGuardian = colIndex(["guardianname", "guardian", "parentname", "parent"]);
  const idxPhone = colIndex(["guardianphone", "phone", "mobile", "contact", "contactnumber"]);
  const idxEmail = colIndex(["guardianemail", "email"]);
  const idxGender = colIndex(["gender"]);
  const idxDob = colIndex(["dateofbirth", "dob"]);
  const idxPrev = colIndex(["previousschool", "prevschool"]);
  const idxStatus = colIndex(["status", "stage"]);

  if (idxStudent === -1 || idxGuardian === -1 || idxPhone === -1) {
    return {
      valid: [],
      errors: ["CSV must include Student Name, Guardian Name, and Guardian Phone columns."],
    };
  }

  const valid: CreateApplicationInput[] = [];
  const errors: string[] = [];

  for (let rowIdx = 1; rowIdx < lines.length; rowIdx += 1) {
    const cells = parseCsvLine(lines[rowIdx]!);
    const studentName = (cells[idxStudent] || "").trim();
    const guardianName = (cells[idxGuardian] || "").trim();
    const guardianPhone = (cells[idxPhone] || "").trim();
    const gradeApplied = (idxGrade >= 0 ? cells[idxGrade] : "")?.trim() || fallbackGrade;
    const academicYear = (idxAy >= 0 ? cells[idxAy] : "")?.trim() || defaultAcademicYear;
    const guardianEmail = (idxEmail >= 0 ? cells[idxEmail] : "")?.trim() || "";
    const rawGender = (idxGender >= 0 ? cells[idxGender] : "")?.trim() || "";
    const gender: "" | "Male" | "Female" | "Other" =
      rawGender === "Male" || rawGender === "Female" || rawGender === "Other" ? rawGender : "";
    const rawDob = (idxDob >= 0 ? cells[idxDob] : "")?.trim() || "";
    const dateOfBirth = /^\d{4}-\d{2}-\d{2}$/.test(rawDob) ? rawDob : "";
    const previousSchool = (idxPrev >= 0 ? cells[idxPrev] : "")?.trim() || "";
    const rawStatus = (idxStatus >= 0 ? cells[idxStatus] : "")?.trim().toUpperCase().replace(/\s+/g, "_");
    const status: "UNDER_REVIEW" | "DOCUMENTS_PENDING" | "SHORTLISTED" =
      rawStatus === "DOCUMENTS_PENDING" || rawStatus === "SHORTLISTED" ? rawStatus : "UNDER_REVIEW";

    if (studentName.length < 2) {
      errors.push(`Row ${rowIdx + 1}: Student Name is missing or too short.`);
      continue;
    }
    if (guardianName.length < 2) {
      errors.push(`Row ${rowIdx + 1}: Guardian Name is missing or too short.`);
      continue;
    }
    if (guardianPhone.length < 7) {
      errors.push(`Row ${rowIdx + 1}: Guardian Phone must be at least 7 digits.`);
      continue;
    }

    valid.push({
      studentName,
      gender,
      dateOfBirth,
      gradeApplied,
      academicYear,
      guardianName,
      guardianRelation: "Parent",
      guardianPhone,
      guardianEmail,
      previousSchool,
      status,
      notes: "",
    });
  }

  return { valid: valid.slice(0, 100), errors };
}

export function ImportApplicationsModal({
  open,
  onClose,
  defaultAcademicYear,
  availableGrades,
  onImport,
}: ImportApplicationsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (typeof dialog.showModal === "function") {
        if (!dialog.open) dialog.showModal();
      } else {
        dialog.setAttribute("open", "true");
      }
    } else if (typeof dialog.close === "function") {
      if (dialog.open) dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  const parsed = useMemo(
    () =>
      csvText.trim()
        ? parseApplicationsCsv(csvText, defaultAcademicYear, availableGrades[0] || "Class I")
        : { valid: [], errors: [] },
    [csvText, defaultAcademicYear, availableGrades],
  );

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(typeof reader.result === "string" ? reader.result : "");
      setSubmitError(null);
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_IMPORT_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "admissions-import-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsed.valid.length === 0) return;
    setSubmitError(null);
    setImporting(true);
    try {
      await onImport(parsed.valid);
      setCsvText("");
      onClose();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to import applications.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="import-applications-dialog-title"
      className="m-auto w-[min(95vw,660px)] rounded-[22px] border border-[#D6DBF0] bg-white p-0 text-[#1B1D45] shadow-2xl dark:border-[#2E345B] dark:bg-[#141731] dark:text-[#DCE1F9]"
    >
      <div className="flex items-center justify-between border-b border-[#DFE3F5] px-6 py-4 dark:border-[#232746]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
            <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1
              id="import-applications-dialog-title"
              className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]"
            >
              Import Applications (CSV)
            </h1>
            <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
              Upload a CSV file or paste rows to create up to 100 validated applications at once.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close import modal"
          className="rounded-full p-1.5 text-[#76799C] hover:bg-[#FAF8FE] hover:text-[#08093B] cursor-pointer dark:text-[#9DA6CC] dark:hover:bg-[#1E2245] dark:hover:text-[#F3F5FF]"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {submitError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-dashed border-[#CAD0EB] bg-[#FAF8FE] p-3.5 dark:border-[#343B6B] dark:bg-[#10142C]">
          <label className="inline-flex items-center gap-2 rounded-[10px] border border-[#D6DBF0] bg-white px-3 py-1.5 text-xs font-bold text-[#08093B] shadow-2xs hover:border-[#663CF6] hover:text-[#663CF6] cursor-pointer dark:border-[#2E345B] dark:bg-[#161A36] dark:text-[#F3F5FF] dark:hover:border-[#8B5CF6] dark:hover:text-[#C4B5FD]">
            <Upload className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
            <span>Choose CSV File</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#A78BFA]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Download CSV Template</span>
          </button>
        </div>

        <div>
          <label
            htmlFor="import-csv-textarea"
            className="block text-xs font-bold text-[#08093B] mb-1.5 dark:text-[#F3F5FF]"
          >
            CSV Data
          </label>
          <textarea
            id="import-csv-textarea"
            rows={5}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Student Name,Grade Applied,Academic Year,Guardian Name,Guardian Phone,Guardian Email"
            className="w-full rounded-[12px] border border-[#CAD0EB] bg-white p-3 font-mono text-[11px] text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:placeholder:text-[#7A83AD]"
          />
        </div>

        {csvText.trim().length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {parsed.valid.length} ready to import
              </span>
              {parsed.errors.length > 0 && (
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {parsed.errors.length} skipped row(s)
                </span>
              )}
            </div>

            {parsed.errors.length > 0 && (
              <ul className="max-h-24 overflow-y-auto rounded-[10px] border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800 space-y-0.5 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-300">
                {parsed.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}

            {parsed.valid.length > 0 && (
              <div className="max-h-36 overflow-auto rounded-[12px] border border-[#DFE3F5] dark:border-[#272B4D]">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#F6F5FD] font-bold text-[#4D5072] dark:bg-[#1B1F3F] dark:text-[#B4BDD9]">
                    <tr>
                      <th className="px-2.5 py-1.5">Student</th>
                      <th className="px-2.5 py-1.5">Grade</th>
                      <th className="px-2.5 py-1.5">Guardian</th>
                      <th className="px-2.5 py-1.5">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#232746]">
                    {parsed.valid.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-2.5 py-1.5 font-semibold text-[#08093B] dark:text-[#F3F5FF]">
                          {row.studentName}
                        </td>
                        <td className="px-2.5 py-1.5 text-[#4D5072] dark:text-[#C5CCF0]">
                          {row.gradeApplied}
                        </td>
                        <td className="px-2.5 py-1.5 text-[#4D5072] dark:text-[#C5CCF0]">
                          {row.guardianName}
                        </td>
                        <td className="px-2.5 py-1.5 text-[#4D5072] dark:text-[#9DA6CC]">
                          {row.guardianPhone}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[#DFE3F5] dark:border-[#232746]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] border border-[#CAD0EB] px-4 py-2 text-xs font-bold text-[#4D5072] hover:bg-[#F8FAFC] cursor-pointer dark:border-[#30365C] dark:text-[#C5CCF0] dark:hover:bg-[#1E2245]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={importing || parsed.valid.length === 0}
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#663CF6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4F27E8] disabled:opacity-50 cursor-pointer"
          >
            {importing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>
              {importing
                ? "Importing..."
                : `Import ${parsed.valid.length > 0 ? parsed.valid.length : ""} Applications`}
            </span>
          </button>
        </div>
      </form>
    </dialog>
  );
}
