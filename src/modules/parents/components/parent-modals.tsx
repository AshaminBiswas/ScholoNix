"use client";

import React, { useState } from "react";
import { Loader2, ShieldAlert, Users, X } from "lucide-react";
import type {
  GuardianRecord,
  GuardianStudentCandidate,
  LinkedWardSummary,
} from "@/modules/parents/types";

const INPUT_CLASS =
  "w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-medium text-[#1B1D45] placeholder:text-[#76799C] focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20 dark:border-[#313761] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:placeholder:text-[#7C83AA] dark:focus:border-[#8B5CF6]";

const LABEL_CLASS =
  "block text-[11px] font-bold text-[#4D5072] mb-1 dark:text-[#B4BDD9]";

const RELATION_OPTIONS = [
  "Father",
  "Mother",
  "Guardian",
  "Grandparent",
  "Sibling",
  "Emergency Contact",
  "Other",
];

export function AddEditGuardianModal({
  open,
  mode,
  guardian,
  students,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: "create" | "edit";
  guardian?: GuardianRecord | null;
  students: GuardianStudentCandidate[];
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(guardian?.fullName ?? "");
  const [phone, setPhone] = useState(guardian?.phone ?? "");
  const [alternatePhone, setAlternatePhone] = useState(guardian?.alternatePhone ?? "");
  const [email, setEmail] = useState(guardian?.email ?? "");
  const [occupation, setOccupation] = useState(guardian?.occupation ?? "");
  const [employer, setEmployer] = useState(guardian?.employer ?? "");
  const [education, setEducation] = useState(guardian?.education ?? "");
  const [preferredLanguage, setPreferredLanguage] = useState(
    guardian?.preferredLanguage ?? "English",
  );
  const [idProofType, setIdProofType] = useState(guardian?.idProofType ?? "");
  const [idProofMasked, setIdProofMasked] = useState(guardian?.idProofMasked ?? "");
  const [addressLine1, setAddressLine1] = useState(guardian?.address?.addressLine1 ?? "");
  const [city, setCity] = useState(guardian?.address?.city ?? "");
  const [state, setState] = useState(guardian?.address?.state ?? "");
  const [postalCode, setPostalCode] = useState(guardian?.address?.postalCode ?? "");
  const [notes, setNotes] = useState(guardian?.notes ?? "");
  const [allowSharedPhone, setAllowSharedPhone] = useState(false);

  // Initial ward binding (create mode)
  const [wardStudentId, setWardStudentId] = useState("");
  const [wardRelation, setWardRelation] = useState("Father");
  const [wardIsPrimary, setWardIsPrimary] = useState(false);
  const [wardCanPickup, setWardCanPickup] = useState(true);
  const [wardIsFeePayer, setWardIsFeePayer] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      setError("Full name and phone number are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        alternatePhone: alternatePhone.trim() || null,
        email: email.trim() || null,
        occupation: occupation.trim() || null,
        employer: employer.trim() || null,
        education: education.trim() || null,
        preferredLanguage: preferredLanguage.trim() || "English",
        idProofType: idProofType.trim() || null,
        idProofMasked: idProofMasked.trim() || null,
        notes: notes.trim() || null,
        address:
          addressLine1.trim() || city.trim() || state.trim() || postalCode.trim()
            ? {
                addressLine1: addressLine1.trim() || null,
                city: city.trim() || null,
                state: state.trim() || null,
                postalCode: postalCode.trim() || null,
              }
            : null,
      };
      if (mode === "create") {
        payload.allowSharedPhone = allowSharedPhone;
        if (wardStudentId) {
          payload.wards = [
            {
              studentId: wardStudentId,
              relation: wardRelation,
              isPrimary: wardIsPrimary,
              isEmergencyContact: true,
              canPickup: wardCanPickup,
              isFeePayer: wardIsFeePayer,
              receivesAcademicAlerts: true,
              receivesFeeAlerts: true,
              restrictedContact: false,
            },
          ];
        }
      }
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save guardian.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guardian-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[20px] border border-[#D6DBF0] bg-white p-5 sm:p-6 shadow-2xl dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex items-center justify-between border-b border-[#DFE3F5] pb-3 dark:border-[#232746]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDE7FF] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
              <Users className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="guardian-modal-title"
                className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]"
              >
                {mode === "create" ? "Add Parent / Guardian" : "Edit Guardian Profile"}
              </h2>
              <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                Maintain contact identity, KYC verification, and ward relationships.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-[#4D5072] hover:bg-[#F5F7FD] dark:text-[#9DA6CC] dark:hover:bg-[#1E2245]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Rajesh Sharma"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Primary Phone *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Alternate Phone</label>
              <input
                type="tel"
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value)}
                placeholder="Optional backup number"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="guardian@example.com"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Occupation</label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g., Architect, Educator"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Employer / Organization</label>
              <input
                type="text"
                value={employer}
                onChange={(e) => setEmployer(e.target.value)}
                placeholder="Organization name"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Education</label>
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="Qualification"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Preferred Language</label>
              <input
                type="text"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>ID Proof Type</label>
              <select
                value={idProofType}
                onChange={(e) => setIdProofType(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">Not Provided</option>
                <option value="Aadhaar">Aadhaar (Masked)</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
                <option value="Voter ID">Voter ID</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Masked ID Reference</label>
              <input
                type="text"
                value={idProofMasked}
                onChange={(e) => setIdProofMasked(e.target.value)}
                placeholder="XXXX-XXXX-1234"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Street Address</label>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="House / Street / Locality"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={LABEL_CLASS}>State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Postal Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </div>

          {mode === "create" && (
            <div className="rounded-xl border border-[#EDE7FF] bg-[#FAF8FE] p-3.5 space-y-3 dark:border-[#2C285A] dark:bg-[#10142C]">
              <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Link Ward (Optional)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASS}>Student</label>
                  <select
                    value={wardStudentId}
                    onChange={(e) => setWardStudentId(e.target.value)}
                    className={INPUT_CLASS}
                  >
                    <option value="">Select student to link...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.studentName} ({s.admissionNumber} · {s.currentGrade})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Relation</label>
                  <select
                    value={wardRelation}
                    onChange={(e) => setWardRelation(e.target.value)}
                    className={INPUT_CLASS}
                  >
                    {RELATION_OPTIONS.map((rel) => (
                      <option key={rel} value={rel}>
                        {rel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {wardStudentId && (
                <div className="flex flex-wrap gap-4 text-xs font-semibold text-[#1B1D45] dark:text-[#DCE1F9]">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wardIsPrimary}
                      onChange={(e) => setWardIsPrimary(e.target.checked)}
                      className="rounded accent-[#663CF6]"
                    />
                    <span>Primary Guardian</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wardCanPickup}
                      onChange={(e) => setWardCanPickup(e.target.checked)}
                      className="rounded accent-[#663CF6]"
                    />
                    <span>Authorized for Pickup</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wardIsFeePayer}
                      onChange={(e) => setWardIsFeePayer(e.target.checked)}
                      className="rounded accent-[#663CF6]"
                    />
                    <span>Fee Payer</span>
                  </label>
                </div>
              )}
              <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#4D5072] cursor-pointer dark:text-[#9DA6CC]">
                <input
                  type="checkbox"
                  checked={allowSharedPhone}
                  onChange={(e) => setAllowSharedPhone(e.target.checked)}
                  className="rounded accent-[#663CF6]"
                />
                <span>Allow creating separate profile even if another guardian uses this phone</span>
              </label>
            </div>
          )}

          <div>
            <label className={LABEL_CLASS}>Internal Staff Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Custody/communication remarks..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DFE3F5] dark:border-[#232746]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[12px] border border-[#CAD0EB] bg-white px-4 py-2 text-xs font-bold text-[#4D5072] hover:bg-[#F5F7FD] dark:border-[#313761] dark:bg-[#10142C] dark:text-[#B4BDD9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-[12px] bg-[#663CF6] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#5B35F5] disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{mode === "create" ? "Save Guardian" : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LinkWardModal({
  open,
  guardian,
  students,
  editingWard,
  onClose,
  onSave,
}: {
  open: boolean;
  guardian: GuardianRecord;
  students: GuardianStudentCandidate[];
  editingWard?: LinkedWardSummary | null;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [studentId, setStudentId] = useState(editingWard?.studentId ?? "");
  const [relation, setRelation] = useState(editingWard?.relation ?? "Parent");
  const [isPrimary, setIsPrimary] = useState(editingWard?.isPrimary ?? false);
  const [isEmergencyContact, setIsEmergencyContact] = useState(
    editingWard?.isEmergencyContact ?? true,
  );
  const [canPickup, setCanPickup] = useState(editingWard?.canPickup ?? true);
  const [isFeePayer, setIsFeePayer] = useState(editingWard?.isFeePayer ?? false);
  const [receivesAcademicAlerts, setReceivesAcademicAlerts] = useState(
    editingWard?.receivesAcademicAlerts ?? true,
  );
  const [receivesFeeAlerts, setReceivesFeeAlerts] = useState(
    editingWard?.receivesFeeAlerts ?? true,
  );
  const [restrictedContact, setRestrictedContact] = useState(
    editingWard?.restrictedContact ?? false,
  );
  const [custodyNote, setCustodyNote] = useState(editingWard?.custodyNote ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      setError("Please select a student.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        studentId,
        relation,
        isPrimary,
        isEmergencyContact,
        canPickup: restrictedContact ? false : canPickup,
        isFeePayer,
        receivesAcademicAlerts,
        receivesFeeAlerts,
        restrictedContact,
        custodyNote: custodyNote.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save ward link.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-ward-title"
    >
      <div className="w-full max-w-lg rounded-[20px] border border-[#D6DBF0] bg-white p-5 sm:p-6 shadow-2xl dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex items-center justify-between border-b border-[#DFE3F5] pb-3 dark:border-[#232746]">
          <h2 id="link-ward-title" className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">
            {editingWard ? `Edit Relationship — ${editingWard.studentName}` : `Link Ward to ${guardian.fullName}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-[#4D5072] hover:bg-[#F5F7FD] dark:text-[#9DA6CC] dark:hover:bg-[#1E2245]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className={LABEL_CLASS}>Student *</label>
            <select
              value={studentId}
              disabled={Boolean(editingWard)}
              onChange={(e) => setStudentId(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Select student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.studentName} ({s.admissionNumber} · {s.currentGrade} - {s.currentSection})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Relationship *</label>
            <select
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className={INPUT_CLASS}
            >
              {RELATION_OPTIONS.map((rel) => (
                <option key={rel} value={rel}>
                  {rel}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-xl border border-[#DFE3F5] bg-[#F5F7FD] p-3 text-xs font-semibold text-[#1B1D45] dark:border-[#272B4D] dark:bg-[#10142C] dark:text-[#DCE1F9]">
            {[
              { label: "Primary Contact", checked: isPrimary, set: setIsPrimary },
              { label: "Emergency Contact", checked: isEmergencyContact, set: setIsEmergencyContact },
              { label: "Pickup Authorized", checked: canPickup && !restrictedContact, set: setCanPickup },
              { label: "Primary Fee Payer", checked: isFeePayer, set: setIsFeePayer },
              { label: "Academic Alerts", checked: receivesAcademicAlerts, set: setReceivesAcademicAlerts },
              { label: "Fee Alerts", checked: receivesFeeAlerts, set: setReceivesFeeAlerts },
            ].map((item) => (
              <label key={item.label} className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => item.set(e.target.checked)}
                  className="rounded accent-[#663CF6]"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 space-y-2 dark:border-amber-800/60 dark:bg-amber-950/30">
            <label className="inline-flex items-center gap-2 text-xs font-bold text-amber-800 cursor-pointer dark:text-amber-300">
              <input
                type="checkbox"
                checked={restrictedContact}
                onChange={(e) => setRestrictedContact(e.target.checked)}
                className="rounded accent-rose-600"
              />
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Restrict Contact / No-Pickup Custody Alert</span>
            </label>
            <input
              type="text"
              value={custodyNote}
              onChange={(e) => setCustodyNote(e.target.value)}
              placeholder="Optional custody or pickup verification instruction..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DFE3F5] dark:border-[#232746]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[12px] border border-[#CAD0EB] bg-white px-4 py-2 text-xs font-bold text-[#4D5072] dark:border-[#313761] dark:bg-[#10142C] dark:text-[#B4BDD9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-[12px] bg-[#663CF6] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#5B35F5] disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Link</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SendGuardianCommModal({
  open,
  guardians,
  onClose,
  onSend,
}: {
  open: boolean;
  guardians: GuardianRecord[];
  onClose: () => void;
  onSend: (payload: {
    guardianIds: string[];
    studentId?: string | null;
    channel: "SMS" | "EMAIL" | "WHATSAPP" | "APP" | "CALL";
    subject?: string;
    body: string;
  }) => Promise<void>;
}) {
  const [channel, setChannel] = useState<"SMS" | "EMAIL" | "WHATSAPP" | "APP" | "CALL">("APP");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      setError("Message content is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSend({
        guardianIds: guardians.map((g) => g.id),
        channel,
        subject: subject.trim() || undefined,
        body: body.trim(),
      });
      setSubject("");
      setBody("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to dispatch message.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comm-modal-title"
    >
      <div className="w-full max-w-lg rounded-[20px] border border-[#D6DBF0] bg-white p-5 sm:p-6 shadow-2xl dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex items-center justify-between border-b border-[#DFE3F5] pb-3 dark:border-[#232746]">
          <div>
            <h2 id="comm-modal-title" className="text-base font-black text-[#08093B] dark:text-[#F3F5FF]">
              Message {guardians.length === 1 ? guardians[0]!.fullName : `${guardians.length} Guardians`}
            </h2>
            <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
              Logged in Guardian Communication History for school compliance.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-[#4D5072] hover:bg-[#F5F7FD] dark:text-[#9DA6CC] dark:hover:bg-[#1E2245]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as typeof channel)}
                className={INPUT_CLASS}
              >
                <option value="APP">Parent Portal App</option>
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="CALL">Phone Call Log</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Subject (Optional)</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., PTM Notice"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Message *</label>
            <textarea
              rows={4}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your notice or follow-up message..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DFE3F5] dark:border-[#232746]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[12px] border border-[#CAD0EB] bg-white px-4 py-2 text-xs font-bold text-[#4D5072] dark:border-[#313761] dark:bg-[#10142C] dark:text-[#B4BDD9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-[12px] bg-[#663CF6] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#5B35F5] disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Dispatch</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
