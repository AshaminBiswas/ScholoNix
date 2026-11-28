"use client";

import React, { useState } from "react";
import { CheckCircle2, FileText, Plus, Upload, XCircle } from "lucide-react";
import type { StudentDossier360Data } from "@/modules/students/dossier-types";
import {
  STUDENT_CARD_SURFACE,
  StudentDonutChart,
} from "@/modules/students/components/student-charts-and-cards";
import { SharedProfileRemarksCard } from "./shared-remarks-card";

const REQUIRED_DOCUMENTS = [
  "Birth Certificate",
  "Aadhaar Card",
  "Photograph",
  "Previous School TC",
  "Address Proof",
  "Medical Certificate",
];

export function TabDocuments({
  dossier,
  canEdit,
  onMutate,
}: {
  dossier: StudentDossier360Data;
  canEdit: boolean;
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [docName, setDocName] = useState("Birth Certificate");
  const [docType, setDocType] = useState("Identity Proof");
  const [fileName, setFileName] = useState("Birth_Certificate.pdf");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    dossier.documents[0]?.id ?? null,
  );

  const verifiedCount = dossier.documents.filter((d) => d.status === "VERIFIED").length;
  const pendingCount = dossier.documents.filter((d) => d.status === "PENDING").length;
  const rejectedCount = dossier.documents.filter((d) => d.status === "REJECTED").length;
  const total = dossier.documents.length;
  const compliancePct = total > 0 ? Math.round((verifiedCount / total) * 100) : 0;

  const filtered = dossier.documents.filter(
    (d) =>
      !search.trim() ||
      d.documentName.toLowerCase().includes(search.trim().toLowerCase()) ||
      d.fileName.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const selectedDoc = dossier.documents.find((d) => d.id === selectedDocId) || filtered[0] || null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !fileName.trim()) return;
    await onMutate({
      action: "ADD_DOCUMENT",
      documentName: docName.trim(),
      documentType: docType,
      isRequired: REQUIRED_DOCUMENTS.includes(docName.trim()),
      fileName: fileName.trim(),
      fileSizeBytes: 512000,
    });
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              Documents Overview (Total: {total})
            </h3>
            {canEdit && (
              <button
                type="button"
                onClick={() => setUploading((v) => !v)}
                className="inline-flex items-center gap-1 rounded-xl bg-[#663CF6] px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Upload Document</span>
              </button>
            )}
          </div>
          {uploading && (
            <form onSubmit={handleUpload} className="grid grid-cols-1 sm:grid-cols-4 gap-2 rounded-xl bg-[#FAF8FE] p-3 dark:bg-[#10142C]">
              <input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Document Name"
                required
                className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
              />
              <input
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                placeholder="Type"
                className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
              />
              <input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="filename.pdf"
                required
                className="rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
              />
              <button type="submit" className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#663CF6] px-3 py-1.5 text-xs font-bold text-white cursor-pointer">
                <Upload className="h-3.5 w-3.5" /> Save
              </button>
            </form>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="rounded-2xl bg-[#EDE7FF]/70 p-3 dark:bg-[#221A44]">
              <p className="text-xl font-black">{total}</p>
              <p className="text-[11px] font-bold">Total</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <p className="text-xl font-black">{verifiedCount}</p>
              <p className="text-[11px] font-bold">Verified</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              <p className="text-xl font-black">{pendingCount}</p>
              <p className="text-[11px] font-bold">Pending</p>
            </div>
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
              <p className="text-xl font-black">{rejectedCount}</p>
              <p className="text-[11px] font-bold">Rejected</p>
            </div>
          </div>
        </div>

        <StudentDonutChart
          title="Document Compliance"
          centerTotal={compliancePct}
          centerLabel="% Complete"
          slices={[
            { label: "Verified", count: verifiedCount, percentage: total ? Math.round((verifiedCount / total) * 100) : 0, color: "#22C55E" },
            { label: "Pending", count: pendingCount, percentage: total ? Math.round((pendingCount / total) * 100) : 0, color: "#F59E0B" },
            { label: "Rejected", count: rejectedCount, percentage: total ? Math.round((rejectedCount / total) * 100) : 0, color: "#EF4444" },
          ]}
        />
      </div>

      {/* Table + Checklist/Inspector */}
      <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            <FileText className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Student Documents</span>
          </h3>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search document by name..."
            className="rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#10142C]"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E9F8] text-[10px] font-extrabold uppercase text-[#76799C] dark:border-[#232746] dark:text-[#9DA6CC]">
                <th className="py-2 pr-3">Document Name</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">File</th>
                <th className="py-2 pr-3">Uploaded</th>
                <th className="py-2 pr-3">Status</th>
                {canEdit && <th className="py-2 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F3FB] dark:divide-[#232746]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#76799C] dark:text-[#9DA6CC]">
                    No documents uploaded yet.
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className="hover:bg-[#FAF8FE] cursor-pointer dark:hover:bg-[#1B1F3F]"
                  >
                    <td className="py-2 pr-3 font-bold">{doc.documentName}</td>
                    <td className="py-2 pr-3">{doc.documentType}</td>
                    <td className="py-2 pr-3 font-mono text-[11px]">{doc.fileName}</td>
                    <td className="py-2 pr-3">{doc.createdAt.slice(0, 10)}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                          doc.status === "VERIFIED"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : doc.status === "REJECTED"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="py-2 text-right space-x-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMutate({ action: "VERIFY_DOCUMENT", documentId: doc.id, status: "VERIFIED" });
                          }}
                          className="rounded p-1 text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                          title="Verify document"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMutate({
                              action: "VERIFY_DOCUMENT",
                              documentId: doc.id,
                              status: "REJECTED",
                              remarks: "Re-upload readable copy",
                            });
                          }}
                          className="rounded p-1 text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Reject document"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-2.5 text-xs`}>
          <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">Required Documents</h3>
          {REQUIRED_DOCUMENTS.map((req) => {
            const found = dossier.documents.find(
              (d) => d.documentName.toLowerCase() === req.toLowerCase(),
            );
            return (
              <div key={req} className="flex items-center justify-between border-b border-[#F1F3FB] pb-1.5 dark:border-[#232746]">
                <span className="font-semibold">{req}</span>
                <span className="font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                  {found ? found.status : "Missing"}
                </span>
              </div>
            );
          })}
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-2 text-xs`}>
          <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">Document Details</h3>
          {!selectedDoc ? (
            <p className="text-[#76799C] dark:text-[#9DA6CC]">Select a document row above to inspect.</p>
          ) : (
            <dl className="space-y-1.5">
              <div className="flex justify-between"><dt className="text-[#76799C]">File</dt><dd className="font-mono font-bold">{selectedDoc.fileName}</dd></div>
              <div className="flex justify-between"><dt className="text-[#76799C]">Type</dt><dd className="font-bold">{selectedDoc.documentType}</dd></div>
              <div className="flex justify-between"><dt className="text-[#76799C]">Uploaded By</dt><dd>{selectedDoc.uploadedByName}</dd></div>
              <div className="flex justify-between"><dt className="text-[#76799C]">Status</dt><dd className="font-bold">{selectedDoc.status}</dd></div>
              <div className="flex justify-between"><dt className="text-[#76799C]">Verified By</dt><dd>{selectedDoc.verifiedByName || "—"}</dd></div>
            </dl>
          )}
        </div>
      </div>

      <SharedProfileRemarksCard
        title="Document Remarks"
        tabScope="DOCUMENTS"
        remarks={dossier.notesRemarks}
        canEdit={canEdit}
        onMutate={onMutate}
      />
    </div>
  );
}
