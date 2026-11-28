"use client";

import React, { useState } from "react";
import { Loader2, MessageSquarePlus, Pencil, Trash2 } from "lucide-react";
import type { StudentNoteRemarkItem } from "@/modules/students/dossier-types";
import { STUDENT_CARD_SURFACE } from "@/modules/students/components/student-charts-and-cards";

export function SharedProfileRemarksCard({
  title,
  tabScope,
  remarks,
  canEdit,
  onMutate,
}: {
  title: string;
  tabScope: StudentNoteRemarkItem["tabScope"];
  remarks: StudentNoteRemarkItem[];
  canEdit: boolean;
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [busy, setBusy] = useState(false);

  const scoped = remarks.filter((r) => r.tabScope === tabScope && r.kind === "REMARK");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setBusy(true);
    try {
      await onMutate({ action: "ADD_REMARK", tabScope, kind: "REMARK", body: draft.trim() });
      setDraft("");
      setAdding(false);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async (remarkId: string) => {
    if (!editBody.trim()) return;
    setBusy(true);
    try {
      await onMutate({ action: "EDIT_REMARK", remarkId, body: editBody.trim() });
      setEditingId(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
          <MessageSquarePlus className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
          <span>{title}</span>
        </h3>
        {canEdit && (
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="rounded-xl border border-[#CAD0EB] bg-white px-3 py-1 text-[11px] font-bold text-[#663CF6] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#C4B5FD]"
          >
            {adding ? "Cancel" : "+ Add Remark"}
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a remark or observation..."
            required
            className="flex-1 rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#663CF6] px-4 py-2 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Save</span>
          </button>
        </form>
      )}

      {scoped.length === 0 ? (
        <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">
          No remarks recorded in this section yet.
        </p>
      ) : (
        <div className="space-y-2">
          {scoped.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 text-xs dark:border-emerald-900/50 dark:bg-emerald-950/30"
            >
              {editingId === item.id ? (
                <div className="flex gap-2">
                  <input
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="flex-1 rounded-lg border border-[#CAD0EB] bg-white px-2.5 py-1 text-xs dark:border-[#343B6B] dark:bg-[#10142C]"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(item.id)}
                    className="rounded-lg bg-[#663CF6] px-3 py-1 font-bold text-white cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#08093B] dark:text-[#F3F5FF]">{item.body}</p>
                    <p className="mt-1 text-[10px] text-[#4D5072] dark:text-[#9DA6CC]">
                      by <strong className="text-[#663CF6] dark:text-[#C4B5FD]">{item.authorName}</strong> •{" "}
                      {new Date(item.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        aria-label="Edit remark"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditBody(item.body);
                        }}
                        className="rounded p-1 text-[#4D5072] hover:bg-white cursor-pointer dark:text-[#9DA6CC] dark:hover:bg-[#1B1F3F]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete remark"
                        onClick={() => onMutate({ action: "DELETE_REMARK", remarkId: item.id })}
                        className="rounded p-1 text-rose-600 hover:bg-white cursor-pointer dark:text-rose-400 dark:hover:bg-[#1B1F3F]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
