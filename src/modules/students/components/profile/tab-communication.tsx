"use client";

import React, { useState } from "react";
import { Bell, Mail, MessageSquare, Send, Smartphone } from "lucide-react";
import type { StudentDossier360Data } from "@/modules/students/dossier-types";
import { STUDENT_CARD_SURFACE } from "@/modules/students/components/student-charts-and-cards";

export function TabCommunication({
  dossier,
  canEdit,
  onMutate,
}: {
  dossier: StudentDossier360Data;
  canEdit: boolean;
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [channel, setChannel] = useState<"MESSAGE" | "EMAIL" | "SMS" | "APP">("MESSAGE");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [replyText, setReplyText] = useState("");

  const total = dossier.communications.length;
  const sent = dossier.communications.filter((c) => c.status === "SENT").length;
  const pending = dossier.communications.filter((c) => c.status === "PENDING").length;
  const failed = dossier.communications.filter((c) => c.status === "FAILED").length;
  const prefs = dossier.extendedProfile.communicationPreferences ?? {
    academicUpdates: true,
    attendanceAlerts: true,
    feeNotifications: true,
    schoolAnnouncements: true,
    autoFeeReminder: true,
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    await onMutate({
      action: "SEND_COMMUNICATION",
      channel,
      direction: "OUTBOUND",
      recipientName: `${dossier.student.guardianName} (Guardian)`,
      subject: subject.trim() || undefined,
      body: body.trim(),
    });
    setSubject("");
    setBody("");
  };

  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    await onMutate({
      action: "SEND_COMMUNICATION",
      channel: "MESSAGE",
      direction: "OUTBOUND",
      recipientName: `${dossier.student.guardianName}`,
      body: replyText.trim(),
    });
    setReplyText("");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            Communication Overview ({dossier.student.currentAcademicYear})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="rounded-2xl bg-[#EDE7FF]/70 p-3 dark:bg-[#221A44]"><p className="text-xl font-black">{total}</p><p className="text-[11px] font-bold">Total</p></div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><p className="text-xl font-black">{sent}</p><p className="text-[11px] font-bold">Sent</p></div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"><p className="text-xl font-black">{pending}</p><p className="text-[11px] font-bold">Pending</p></div>
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"><p className="text-xl font-black">{failed}</p><p className="text-[11px] font-bold">Failed</p></div>
          </div>
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">Communication Channels</h3>
          <div className="grid grid-cols-2 gap-2.5 text-xs font-bold">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-2.5 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><Mail className="h-4 w-4" /> Email</div>
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-2.5 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><Smartphone className="h-4 w-4" /> SMS</div>
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-2.5 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><Bell className="h-4 w-4" /> App Notification</div>
            <div className="flex items-center gap-2 rounded-xl bg-[#FAF8FE] p-2.5 text-[#76799C] dark:bg-[#10142C] dark:text-[#9DA6CC]"><MessageSquare className="h-4 w-4" /> Direct Chat</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <form onSubmit={handleSend} className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">Send Communication</h3>
          <div className="grid grid-cols-4 gap-1.5">
            {(["MESSAGE", "EMAIL", "SMS", "APP"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChannel(c)}
                className={`rounded-xl py-1.5 text-[11px] font-bold cursor-pointer ${
                  channel === c ? "bg-[#663CF6] text-white" : "bg-[#FAF8FE] text-[#4D5072] dark:bg-[#10142C] dark:text-[#9DA6CC]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject..."
            className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#343B6B] dark:bg-[#10142C]"
          />
          <textarea
            rows={4}
            maxLength={500}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write message to parent/guardian..."
            required
            className="w-full rounded-xl border border-[#CAD0EB] bg-white p-3 text-xs dark:border-[#343B6B] dark:bg-[#10142C]"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#76799C]">{body.length} / 500</span>
            <button
              type="submit"
              disabled={!canEdit}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#663CF6] px-4 py-2 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" /> Send Message
            </button>
          </div>
        </form>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 flex flex-col justify-between space-y-3`}>
          <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">Conversation History</h3>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 text-xs">
            {dossier.communications.length === 0 ? (
              <p className="text-[#76799C] dark:text-[#9DA6CC]">No conversation history yet.</p>
            ) : (
              dossier.communications.slice(0, 12).map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-2xl p-3 ${
                    msg.direction === "OUTBOUND"
                      ? "ml-6 bg-[#EDE7FF]/80 dark:bg-[#221A44]"
                      : "mr-6 bg-[#FAF8FE] dark:bg-[#10142C]"
                  }`}
                >
                  <p className="text-[10px] font-bold text-[#663CF6] dark:text-[#C4B5FD]">
                    {msg.senderName} ({msg.channel}) • {new Date(msg.createdAt).toLocaleString("en-IN")}
                  </p>
                  {msg.subject && <p className="font-bold mt-0.5">{msg.subject}</p>}
                  <p className="mt-0.5">{msg.body}</p>
                </div>
              ))
            )}
          </div>
          {canEdit && (
            <form onSubmit={handleChatSend} className="flex gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type a quick reply..."
                className="flex-1 rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#10142C]"
              />
              <button type="submit" className="rounded-xl bg-[#663CF6] px-3 py-1.5 text-white cursor-pointer">
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Preferences */}
      <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-2.5 text-xs`}>
        <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">Communication Preferences</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(
            [
              ["academicUpdates", "Academic Updates"],
              ["attendanceAlerts", "Attendance Alerts"],
              ["feeNotifications", "Fee Notifications"],
              ["schoolAnnouncements", "School Announcements"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center justify-between rounded-xl bg-[#FAF8FE] px-3 py-2 font-semibold cursor-pointer dark:bg-[#10142C]"
            >
              <span>{label}</span>
              <input
                type="checkbox"
                checked={prefs[key]}
                disabled={!canEdit}
                onChange={(e) =>
                  onMutate({
                    action: "UPDATE_EXTENDED_PROFILE",
                    extended: {
                      communicationPreferences: {
                        ...prefs,
                        [key]: e.target.checked,
                      },
                    },
                  })
                }
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
