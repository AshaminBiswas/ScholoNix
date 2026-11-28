"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Award,
  CheckSquare,
  CreditCard,
  Edit3,
  Eye,
  EyeOff,
  FileCheck2,
  Home,
  Phone,
  Shield,
  Trash2,
  Upload,
  User,
  Users,
} from "lucide-react";
import type { StudentDossier360Data } from "@/modules/students/dossier-types";
import { STUDENT_CARD_SURFACE } from "@/modules/students/components/student-charts-and-cards";
import { SharedProfileRemarksCard } from "./shared-remarks-card";

export function TabProfileOverview({
  dossier,
  canEdit,
  onMutate,
  onEditStudent,
}: {
  dossier: StudentDossier360Data;
  canEdit: boolean;
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
  onEditStudent: () => void;
}) {
  const [guardianTab, setGuardianTab] = useState<"father" | "mother" | "guardian">("father");
  const [revealAadhaar, setRevealAadhaar] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  const pathSlug =
    typeof window !== "undefined"
      ? window.location.pathname.split("/").filter(Boolean)[0] ?? null
      : null;
  const schoolSlug =
    pathSlug && pathSlug !== "admin" && pathSlug !== "company-admin-pannel" ? pathSlug : null;
  const s = dossier.student;
  const ext = dossier.extendedProfile;

  const attendancePresent = dossier.attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const attendancePct =
    dossier.attendanceRecords.length > 0
      ? Math.round((attendancePresent / dossier.attendanceRecords.length) * 1000) / 10
      : 0;

  const avgExamPct =
    dossier.examResults.length > 0
      ? Math.round(
          (dossier.examResults.reduce((acc, r) => acc + r.marksObtained, 0) /
            Math.max(
              1,
              dossier.examResults.reduce((acc, r) => acc + r.maxMarks, 0),
            )) *
            1000,
        ) / 10
      : 0;

  const verifiedDocs = dossier.documents.filter((d) => d.status === "VERIFIED").length;
  const tasks = dossier.notesRemarks.filter((n) => n.tabScope === "PROFILE" && n.kind === "TASK");

  const activeGuardian =
    guardianTab === "father"
      ? {
          name: ext.father?.name || (s.guardianRelation === "Father" ? s.guardianName : "—"),
          relation: "Father",
          phone: ext.father?.phone || (s.guardianRelation === "Father" ? s.guardianPhone : "—"),
          email: ext.father?.email || (s.guardianRelation === "Father" ? s.guardianEmail || "—" : "—"),
          occupation: ext.father?.occupation || "—",
        }
      : guardianTab === "mother"
        ? {
            name: ext.mother?.name || (s.guardianRelation === "Mother" ? s.guardianName : "—"),
            relation: "Mother",
            phone: ext.mother?.phone || (s.guardianRelation === "Mother" ? s.guardianPhone : "—"),
            email: ext.mother?.email || (s.guardianRelation === "Mother" ? s.guardianEmail || "—" : "—"),
            occupation: ext.mother?.occupation || "—",
          }
        : {
            name: s.guardianName,
            relation: s.guardianRelation,
            phone: s.guardianPhone,
            email: s.guardianEmail || "—",
            occupation: "Primary Contact",
          };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    await onMutate({
      action: "ADD_REMARK",
      tabScope: "PROFILE",
      kind: "TASK",
      body: taskTitle.trim(),
      dueDate: new Date().toISOString().slice(0, 10),
    });
    setTaskTitle("");
    setAddingTask(false);
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Personal Info, Profile Summary, Profile Picture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              <User className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>Personal Information</span>
            </h3>
            {canEdit && (
              <button
                type="button"
                onClick={onEditStudent}
                className="rounded-lg p-1 text-[#663CF6] hover:bg-[#EDE7FF] cursor-pointer dark:text-[#C4B5FD] dark:hover:bg-[#251D4A]"
                aria-label="Edit personal information"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <dl className="space-y-2 text-xs">
            {[
              ["Full Name", s.studentName],
              ["Date of Birth", s.dateOfBirth ? s.dateOfBirth.slice(0, 10) : "—"],
              ["Gender", s.gender || "—"],
              ["Blood Group", s.bloodGroup || "—"],
              ["Category", ext.category || "General"],
              ["Nationality", s.nationality || "Indian"],
              ["Religion", ext.religion || "—"],
              ["Mother Tongue", ext.motherTongue || "—"],
              ["Languages Known", ext.languagesKnown || "—"],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <dt className="text-[#76799C] dark:text-[#9DA6CC]">{label}</dt>
                <dd className="font-bold text-[#08093B] text-right dark:text-[#F3F5FF]">{val}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-2">
              <dt className="text-[#76799C] dark:text-[#9DA6CC]">Aadhaar No.</dt>
              <dd className="inline-flex items-center gap-1.5 font-mono font-bold text-[#08093B] dark:text-[#F3F5FF]">
                <span>
                  {revealAadhaar && dossier.canRevealSensitiveId && ext.aadhaarFull
                    ? ext.aadhaarFull
                    : ext.aadhaarMasked || "XXXX XXXX —"}
                </span>
                {dossier.canRevealSensitiveId && ext.aadhaarFull && (
                  <button
                    type="button"
                    onClick={() => setRevealAadhaar((v) => !v)}
                    aria-label="Toggle sensitive Aadhaar reveal"
                    className="text-[#663CF6] cursor-pointer dark:text-[#C4B5FD]"
                  >
                    {revealAadhaar ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            <Award className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Profile Summary</span>
          </h3>
          <dl className="space-y-2 text-xs">
            {[
              ["Student Status", s.status],
              ["Admission Date", s.admissionDate.slice(0, 10)],
              ["Admission Type", s.admissionType],
              ["Current Class", s.currentGrade],
              ["Section", s.currentSection],
              ["Roll No.", s.currentRollNumber || "—"],
              ["House", ext.houseName || dossier.groups[0]?.name || "Unassigned"],
              ["Transport", ext.transportRoute || "No"],
              ["Hostel", ext.hostelName || "No"],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <dt className="text-[#76799C] dark:text-[#9DA6CC]">{label}</dt>
                <dd className="font-bold text-[#08093B] text-right dark:text-[#F3F5FF]">{val}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 flex flex-col items-center justify-between space-y-3`}>
          <h3 className="self-start text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            Profile Picture
          </h3>
          <div className="flex h-36 w-36 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#5B35F5] text-4xl font-black text-white shadow-inner">
            {s.studentName.slice(0, 2).toUpperCase()}
          </div>
          {canEdit && (
            <div className="flex w-full gap-2">
              <button
                type="button"
                onClick={onEditStudent}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs font-bold text-[#08093B] hover:border-[#663CF6] cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Change Photo</span>
              </button>
              <button
                type="button"
                onClick={() => onMutate({ action: "UPDATE_EXTENDED_PROFILE", photoKey: null })}
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 cursor-pointer dark:border-rose-800/60 dark:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove</span>
              </button>
            </div>
          )}
          <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
            Allowed: JPG, PNG (Max 2 MB)
          </p>
        </div>
      </div>

      {/* Row 2: Contact Info & Parent / Guardian Switcher */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            <Phone className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Contact Information</span>
          </h3>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-[#76799C] dark:text-[#9DA6CC]">Student Mobile</dt>
              <dd className="font-mono font-bold text-[#08093B] dark:text-[#F3F5FF]">
                {s.phone || s.guardianPhone}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#76799C] dark:text-[#9DA6CC]">Student Email</dt>
              <dd className="font-semibold text-[#08093B] dark:text-[#F3F5FF]">
                {s.email || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#76799C] dark:text-[#9DA6CC]">Alternate Mobile</dt>
              <dd className="font-mono font-bold text-[#08093B] dark:text-[#F3F5FF]">
                {ext.alternatePhone || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#76799C] dark:text-[#9DA6CC]">Address (Current)</dt>
              <dd className="font-semibold text-right text-[#08093B] dark:text-[#F3F5FF]">
                {[s.address?.addressLine1, s.address?.city, s.address?.state, s.address?.postalCode]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              <Users className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>Parent / Guardian Information</span>
            </h3>
            <div className="inline-flex rounded-xl bg-[#F3EFFF] p-1 dark:bg-[#10142C]">
              {(["father", "mother", "guardian"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGuardianTab(g)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize cursor-pointer ${
                    guardianTab === g
                      ? "bg-[#663CF6] text-white"
                      : "text-[#4D5072] dark:text-[#9DA6CC]"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between">
              <dt className="text-[#76799C] dark:text-[#9DA6CC]">Name</dt>
              <dd className="font-bold text-[#08093B] dark:text-[#F3F5FF]">{activeGuardian.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#76799C] dark:text-[#9DA6CC]">Relation</dt>
              <dd className="font-bold text-[#08093B] dark:text-[#F3F5FF]">{activeGuardian.relation}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#76799C] dark:text-[#9DA6CC]">Mobile</dt>
              <dd className="font-mono font-bold text-[#08093B] dark:text-[#F3F5FF]">{activeGuardian.phone}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#76799C] dark:text-[#9DA6CC]">Email</dt>
              <dd className="font-semibold text-[#08093B] dark:text-[#F3F5FF]">{activeGuardian.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#76799C] dark:text-[#9DA6CC]">Occupation</dt>
              <dd className="font-semibold text-[#08093B] dark:text-[#F3F5FF]">{activeGuardian.occupation}</dd>
            </div>
          </dl>
          {schoolSlug && (
            <div className="pt-2 border-t border-[#DFE3F5] dark:border-[#232746] flex justify-end">
              <Link
                href={`/${encodeURIComponent(schoolSlug)}/parents`}
                className="text-[11px] font-bold text-[#663CF6] hover:underline dark:text-[#C4B5FD]"
              >
                Open Parents &amp; Guardians Directory &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Identifications & Address */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            <Shield className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Identifications &amp; Other Details</span>
          </h3>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between">
              <dt className="text-[#76799C] dark:text-[#9DA6CC]">Identification Marks</dt>
              <dd className="font-semibold text-[#08093B] dark:text-[#F3F5FF]">
                {ext.identificationMarks || "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#76799C] dark:text-[#9DA6CC]">Medical Information</dt>
              <dd className="font-semibold text-[#08093B] dark:text-[#F3F5FF]">
                {s.medicalNotes || "No known allergies"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#76799C] dark:text-[#9DA6CC]">Special Need</dt>
              <dd className="font-semibold text-[#08093B] dark:text-[#F3F5FF]">
                {ext.specialNeed || "No"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#76799C] dark:text-[#9DA6CC]">RTE / Concession</dt>
              <dd className="font-semibold text-[#08093B] dark:text-[#F3F5FF]">
                {ext.rteConcession || "No"}
              </dd>
            </div>
          </dl>
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            <Home className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Address Information</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-[#FAF8FE] p-3 dark:bg-[#10142C]">
              <p className="font-extrabold text-[#663CF6] dark:text-[#C4B5FD]">Permanent Address</p>
              <p className="mt-1 text-[#08093B] dark:text-[#DCE1F9]">
                {[
                  ext.permanentAddress?.line1 || s.address?.addressLine1,
                  ext.permanentAddress?.city || s.address?.city,
                  ext.permanentAddress?.state || s.address?.state,
                  ext.permanentAddress?.postalCode || s.address?.postalCode,
                ]
                  .filter(Boolean)
                  .join(", ") || "Not updated yet"}
              </p>
            </div>
            <div className="rounded-xl bg-[#FAF8FE] p-3 dark:bg-[#10142C]">
              <p className="font-extrabold text-[#663CF6] dark:text-[#C4B5FD]">Current Address</p>
              <p className="mt-1 text-[#08093B] dark:text-[#DCE1F9]">
                {ext.currentAddressSameAsPermanent
                  ? "Same as Permanent Address"
                  : [s.address?.addressLine1, s.address?.city, s.address?.state, s.address?.postalCode]
                      .filter(Boolean)
                      .join(", ") || "Same as Permanent Address"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Quick Stats + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <h3 className="text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">Quick Stats</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
            <div className="rounded-xl bg-[#EDE7FF]/70 p-3 dark:bg-[#221A44]">
              <p className="text-lg font-black text-[#5B35F5] dark:text-[#CBB8FF]">
                {avgExamPct}%
              </p>
              <p className="text-[10px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">Academic</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/50">
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                {attendancePct}%
              </p>
              <p className="text-[10px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">Attendance</p>
            </div>
            <div className="rounded-xl bg-rose-50 p-3 dark:bg-rose-950/50">
              <p className="flex items-center justify-center gap-0.5 text-lg font-black text-rose-700 dark:text-rose-300">
                <CreditCard className="h-3.5 w-3.5" />
                <span>₹{Math.round(dossier.feeSummary.paidPaise / 100).toLocaleString("en-IN")}</span>
              </p>
              <p className="text-[10px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">Fees Paid</p>
            </div>
            <div className="rounded-xl bg-sky-50 p-3 dark:bg-sky-950/50">
              <p className="flex items-center justify-center gap-1 text-lg font-black text-sky-700 dark:text-sky-300">
                <FileCheck2 className="h-3.5 w-3.5" />
                <span>
                  {verifiedDocs}/{dossier.documents.length}
                </span>
              </p>
              <p className="text-[10px] font-bold text-[#4D5072] dark:text-[#9DA6CC]">Docs Verified</p>
            </div>
          </div>
        </div>

        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-2.5`}>
          <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
            <Activity className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
            <span>Recent Activities</span>
          </h3>
          {dossier.activities.length === 0 ? (
            <p className="text-xs text-[#76799C] dark:text-[#9DA6CC]">No recent activities logged yet.</p>
          ) : (
            <div className="space-y-1.5 text-xs">
              {dossier.activities.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#08093B] truncate dark:text-[#DCE1F9]">{a.summary}</span>
                  <span className="shrink-0 text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                    {new Date(a.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 5: Open Tasks & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${STUDENT_CARD_SURFACE} p-4 sm:p-5 space-y-3`}>
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-black text-[#08093B] dark:text-[#F3F5FF]">
              <CheckSquare className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
              <span>Open Tasks &amp; Reminders</span>
            </h3>
            {canEdit && (
              <button
                type="button"
                onClick={() => setAddingTask((v) => !v)}
                className="text-[11px] font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
              >
                {addingTask ? "Cancel" : "+ Add Task"}
              </button>
            )}
          </div>
          {addingTask && (
            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Collect transport consent form..."
                className="flex-1 rounded-xl border border-[#CAD0EB] bg-white px-3 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#10142C]"
              />
              <button type="submit" className="rounded-xl bg-[#663CF6] px-3 py-1.5 text-xs font-bold text-white cursor-pointer">
                Add
              </button>
            </form>
          )}
          <div className="space-y-2 text-xs">
            {tasks.length === 0 ? (
              <p className="text-[#76799C] dark:text-[#9DA6CC]">No open tasks.</p>
            ) : (
              tasks.map((t) => (
                <label key={t.id} className="flex items-center justify-between gap-2 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={t.isCompleted}
                      onChange={() =>
                        onMutate({ action: "TOGGLE_TASK", remarkId: t.id, isCompleted: !t.isCompleted })
                      }
                    />
                    <span className={t.isCompleted ? "line-through text-[#76799C]" : "font-semibold"}>
                      {t.body}
                    </span>
                  </span>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                    {t.isCompleted ? "Done" : "Pending"}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        <SharedProfileRemarksCard
          title="Notes & Remarks"
          tabScope="PROFILE"
          remarks={dossier.notesRemarks}
          canEdit={canEdit}
          onMutate={onMutate}
        />
      </div>
    </div>
  );
}
