"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarCheck,
  Check,
  Copy,
  CreditCard,
  Edit3,
  FileText,
  GraduationCap,
  History,
  Mail,
  MessageSquare,
  Phone,
  Printer,
  QrCode,
  Search,
  User,
  Users,
  X,
} from "lucide-react";
import type { StudentRecord } from "@/modules/students/types";
import type { StudentProfileTab } from "@/modules/students/dossier-types";
import { STUDENT_CARD_SURFACE } from "@/modules/students/components/student-charts-and-cards";

const PROFILE_TABS: Array<{
  key: StudentProfileTab;
  label: string;
  icon: React.ReactNode;
}> = [
  { key: "profile", label: "Profile", icon: <User className="h-3.5 w-3.5" /> },
  { key: "academic", label: "Academic", icon: <GraduationCap className="h-3.5 w-3.5" /> },
  { key: "attendance", label: "Attendance", icon: <CalendarCheck className="h-3.5 w-3.5" /> },
  { key: "fees", label: "Fees", icon: <CreditCard className="h-3.5 w-3.5" /> },
  { key: "documents", label: "Documents", icon: <FileText className="h-3.5 w-3.5" /> },
  { key: "communication", label: "Communication", icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { key: "activities", label: "Activities", icon: <Activity className="h-3.5 w-3.5" /> },
  { key: "history", label: "History", icon: <History className="h-3.5 w-3.5" /> },
];

function statusPillCls(status: StudentRecord["status"]): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-500 text-white";
    case "INACTIVE":
      return "bg-amber-500 text-white";
    case "TRANSFERRED":
      return "bg-sky-500 text-white";
    case "ALUMNI":
      return "bg-pink-500 text-white";
    default:
      return "bg-rose-500 text-white";
  }
}

export function StudentProfileHeader({
  student,
  allStudents,
  activeTab,
  canEdit,
  pdfUrl,
  onTabChange,
  onSelectStudent,
  onBackToList,
  onEditProfile,
  onOpenIdCard,
}: {
  student: StudentRecord;
  allStudents: StudentRecord[];
  activeTab: StudentProfileTab;
  canEdit: boolean;
  pdfUrl?: string;
  onTabChange: (tab: StudentProfileTab) => void;
  onSelectStudent: (studentId: string) => void;
  onBackToList: () => void;
  onEditProfile: () => void;
  onOpenIdCard: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedAdm, setCopiedAdm] = useState(false);

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = !q
      ? allStudents
      : allStudents.filter((s) =>
          [
            s.studentName,
            s.admissionNumber,
            s.currentRollNumber,
            s.phone,
            s.guardianPhone,
            s.email,
            s.guardianName,
          ]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q)),
        );
    return list.slice(0, 6);
  }, [allStudents, searchQuery]);

  const handleCopyAdmissionNo = async () => {
    try {
      await navigator.clipboard.writeText(student.admissionNumber);
      setCopiedAdm(true);
      setTimeout(() => setCopiedAdm(false), 1500);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-[#76799C] dark:text-[#9DA6CC]">
            <span>Students</span>
            <span className="mx-1.5">&gt;</span>
            <span className="text-[#663CF6] dark:text-[#C4B5FD]">Student Profile</span>
          </p>
          <h2 className="mt-0.5 text-xl sm:text-2xl font-black tracking-tight text-[#08093B] dark:text-[#F3F5FF]">
            Student Profile
          </h2>
          <p className="text-xs text-[#4D5072] dark:text-[#9DA6CC]">
            Complete profile, academic, personal, contact and school information of the student.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onBackToList}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#CAD0EB] bg-white px-3.5 py-2 text-xs font-bold text-[#08093B] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to List</span>
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={onEditProfile}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#5B35F5] px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:opacity-95 cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </button>
          )}

          {pdfUrl ? (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#CAD0EB] bg-white px-3.5 py-2 text-xs font-bold text-[#08093B] hover:border-[#663CF6] dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
            >
              <Printer className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>Print Profile</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#CAD0EB] bg-white px-3.5 py-2 text-xs font-bold text-[#08093B] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
            >
              <Printer className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>Print Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Select Student Bar */}
      <div className={`${STUDENT_CARD_SURFACE} relative z-20 p-3.5 sm:p-4`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              <Search className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-black text-[#08093B] dark:text-[#F3F5FF]">
                Search &amp; Select Student
              </p>
              <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                Search by name, admission no., roll no., mobile or email to switch profiles.
              </p>
            </div>
          </div>

          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#76799C] dark:text-[#9DA6CC]" />
            <input
              type="search"
              aria-label="Search and select student profile"
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              placeholder="Search student by name, admission no., roll no, mobile, or email..."
              className="w-full rounded-xl border border-[#CAD0EB] bg-[#FAF8FE] pl-9 pr-8 py-2 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            />
            {searchOpen && (
              <button
                type="button"
                aria-label="Close student switcher"
                onClick={() => setSearchOpen(false)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#76799C] hover:text-[#08093B] cursor-pointer dark:text-[#9DA6CC]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {searchOpen && (
              <div className="absolute left-0 right-0 mt-2 rounded-2xl border border-[#D6DBF0] bg-white p-2 shadow-2xl space-y-1 dark:border-[#272B4D] dark:bg-[#141731]">
                {searchMatches.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-[#76799C] dark:text-[#9DA6CC]">
                    No students matched &ldquo;{searchQuery}&rdquo;.
                  </p>
                ) : (
                  searchMatches.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onSelectStudent(m.id);
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition cursor-pointer ${
                        m.id === student.id
                          ? "bg-[#EDE7FF] dark:bg-[#251D4A]"
                          : "hover:bg-[#FAF8FE] dark:hover:bg-[#1B1F3F]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#5B35F5] text-[11px] font-black text-white">
                          {m.studentName.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-[#08093B] truncate dark:text-[#F3F5FF]">
                            {m.studentName}
                          </p>
                          <p className="text-[10px] font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                            {m.admissionNumber} | {m.currentGrade} - {m.currentSection}
                            {m.currentRollNumber ? ` | Roll No. ${m.currentRollNumber}` : ""}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${statusPillCls(
                          m.status,
                        )}`}
                      >
                        {m.status}
                      </span>
                    </button>
                  ))
                )}
                <button
                  type="button"
                  onClick={onBackToList}
                  className="w-full flex items-center justify-between border-t border-[#EEF1FA] pt-2 px-3 pb-1 text-[11px] font-bold text-[#663CF6] hover:underline cursor-pointer dark:border-[#232746] dark:text-[#C4B5FD]"
                >
                  <span>
                    {searchQuery ? `View all results for "${searchQuery}"` : "Browse full Student List"}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Persistent Student Identity Hero Card */}
      <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 min-w-0">
            <div className="relative h-20 w-20 shrink-0 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#4F27E8] flex items-center justify-center text-2xl font-black text-white shadow-md">
              {student.studentName.slice(0, 2).toUpperCase()}
              <span
                className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold shadow-xs ${statusPillCls(
                  student.status,
                )}`}
              >
                {student.status === "ACTIVE" ? "Active" : student.status}
              </span>
            </div>

            <div className="space-y-1 min-w-0">
              <h3 className="text-xl font-black text-[#08093B] truncate dark:text-[#F3F5FF]">
                {student.studentName}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[#4D5072] dark:text-[#9DA6CC]">Admission No.</span>
                <span className="font-mono font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                  {student.admissionNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyAdmissionNo}
                  aria-label="Copy admission number"
                  className="rounded-md p-1 text-[#663CF6] hover:bg-[#EDE7FF] cursor-pointer dark:text-[#C4B5FD] dark:hover:bg-[#251D4A]"
                >
                  {copiedAdm ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-[#4D5072] dark:text-[#9DA6CC]">
                <span className="inline-flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#C4B5FD]" />
                  {student.currentGrade} - Section {student.currentSection}
                </span>
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#C4B5FD]" />
                  Roll No. {student.currentRollNumber || "—"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#C4B5FD]" />
                  Academic Year: {student.currentAcademicYear}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 border-t border-[#EEF1FA] pt-3 lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0 dark:border-[#232746]">
            <div className="space-y-1.5 text-xs">
              <p className="flex items-center gap-2 font-semibold text-[#08093B] dark:text-[#DCE1F9]">
                <Phone className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#C4B5FD]" />
                <span>{student.phone || student.guardianPhone}</span>
              </p>
              <p className="flex items-center gap-2 font-semibold text-[#08093B] dark:text-[#DCE1F9]">
                <Mail className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#C4B5FD]" />
                <span>{student.email || student.guardianEmail || "Not on file"}</span>
              </p>
              <p className="flex items-center gap-2 font-semibold text-[#08093B] dark:text-[#DCE1F9]">
                <Users className="h-3.5 w-3.5 text-[#663CF6] dark:text-[#C4B5FD]" />
                <span>
                  {student.guardianName} ({student.guardianRelation})
                </span>
              </p>
              <p className="flex items-center gap-2 font-semibold text-[#08093B] dark:text-[#DCE1F9]">
                <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{student.guardianPhone}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenIdCard}
              className="flex flex-col items-center justify-center rounded-2xl border border-[#DDD6FE] bg-[#FAF8FE] px-3.5 py-2.5 hover:border-[#663CF6] cursor-pointer dark:border-[#342B63] dark:bg-[#10142C]"
            >
              <QrCode className="h-11 w-11 text-[#08093B] dark:text-[#F3F5FF]" />
              <span className="mt-1 text-[10px] font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Student ID
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 8 Horizontal Profile Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Student Profile 360 Sections"
        className={`${STUDENT_CARD_SURFACE} p-1.5 flex flex-wrap items-center gap-1.5`}
      >
        {PROFILE_TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onTabChange(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                active
                  ? "bg-gradient-to-r from-[#7C5CFC] to-[#5B35F5] text-white shadow-sm"
                  : "text-[#4D5072] hover:bg-[#F3EFFF] hover:text-[#663CF6] dark:text-[#A9B2D8] dark:hover:bg-[#1F2248] dark:hover:text-[#F3F5FF]"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
