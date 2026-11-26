"use client";

import React from "react";
import { Users, MapPin, FileText, User, Briefcase, Mail, Phone } from "lucide-react";
import type { AdmissionCommunicationMode } from "@/modules/school/admissions/types";
import { INDIAN_STATES, type ApplicationWizardFormState } from "./wizard-types";

interface Step2ParentGuardianProps {
  state: ApplicationWizardFormState;
  onChange: (patch: Partial<ApplicationWizardFormState>) => void;
}

export function Step2ParentGuardian({ state, onChange }: Step2ParentGuardianProps) {
  const inputClass =
    "w-full rounded-[11px] border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-medium text-[#08093B] placeholder:text-[#76799C] focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#EDE7FF] disabled:opacity-60 dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:placeholder:text-[#7A83AD] dark:focus:border-[#8B5CF6]";

  const handleToggleSameAddress = (checked: boolean) => {
    if (checked) {
      onChange({
        sameAsStudentAddress: true,
        guardianAddressLine1: state.studentAddressLine1,
        guardianAddressLine2: state.studentAddressLine2,
        guardianCity: state.studentCity,
        guardianState: state.studentState,
        guardianPostalCode: state.studentPostalCode,
      });
    } else {
      onChange({ sameAsStudentAddress: false });
    }
  };

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#D6DBF0] bg-white shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
      <div className="bg-gradient-to-r from-[#663CF6] via-[#7C5CFF] to-[#93C5FD] px-5 py-3.5 text-white dark:from-[#4F27E8] dark:via-[#663CF6] dark:to-[#3B82F6]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/15">
            <Users className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-white">Parent/Guardian Information</h3>
            <p className="text-[11px] text-white/90">
              Provide details of the student&apos;s parent(s) or legal guardian(s).
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Primary Parent / Guardian */}
        <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE]/70 p-4 space-y-3.5 dark:border-[#272B4D] dark:bg-[#10142C]/60">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
            <h4 className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Primary Parent/Guardian (Father / Guardian 1)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="wiz-g1-name" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#76799C]" />
                <input
                  id="wiz-g1-name"
                  type="text"
                  required
                  value={state.primaryName}
                  onChange={(e) => onChange({ primaryName: e.target.value })}
                  placeholder="Enter full name"
                  className={`${inputClass} pl-8`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="wiz-g1-rel" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                Relationship <span className="text-rose-500">*</span>
              </label>
              <select
                id="wiz-g1-rel"
                value={state.primaryRelationship}
                onChange={(e) => onChange({ primaryRelationship: e.target.value })}
                className={inputClass}
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Legal Guardian">Legal Guardian</option>
              </select>
            </div>

            <div>
              <label htmlFor="wiz-g1-occ" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                Occupation
              </label>
              <div className="relative">
                <Briefcase className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#76799C]" />
                <input
                  id="wiz-g1-occ"
                  type="text"
                  value={state.primaryOccupation}
                  onChange={(e) => onChange({ primaryOccupation: e.target.value })}
                  placeholder="Enter occupation"
                  className={`${inputClass} pl-8`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="wiz-g1-income" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                Annual Income
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#76799C]">
                  ₹
                </span>
                <input
                  id="wiz-g1-income"
                  type="text"
                  value={state.primaryAnnualIncome}
                  onChange={(e) => onChange({ primaryAnnualIncome: e.target.value })}
                  placeholder="Enter annual income"
                  className={`${inputClass} pl-7`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="wiz-g1-email" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#76799C]" />
                <input
                  id="wiz-g1-email"
                  type="email"
                  required
                  value={state.primaryEmail}
                  onChange={(e) => onChange({ primaryEmail: e.target.value })}
                  placeholder="Enter email address"
                  className={`${inputClass} pl-8`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="wiz-g1-phone" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#76799C]" />
                <input
                  id="wiz-g1-phone"
                  type="tel"
                  required
                  value={state.primaryPhone}
                  onChange={(e) => onChange({ primaryPhone: e.target.value })}
                  placeholder="Enter phone number"
                  className={`${inputClass} pl-8`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Parent / Guardian */}
        <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE]/70 p-4 space-y-3.5 dark:border-[#272B4D] dark:bg-[#10142C]/60">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
            <h4 className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Secondary Parent/Guardian (Mother / Guardian 2)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="wiz-g2-name" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                Full Name
              </label>
              <input
                id="wiz-g2-name"
                type="text"
                value={state.secondaryName}
                onChange={(e) => onChange({ secondaryName: e.target.value })}
                placeholder="Enter full name"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="wiz-g2-rel" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                Relationship
              </label>
              <select
                id="wiz-g2-rel"
                value={state.secondaryRelationship}
                onChange={(e) => onChange({ secondaryRelationship: e.target.value })}
                className={inputClass}
              >
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="Legal Guardian">Legal Guardian</option>
              </select>
            </div>

            <div>
              <label htmlFor="wiz-g2-occ" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                Occupation
              </label>
              <input
                id="wiz-g2-occ"
                type="text"
                value={state.secondaryOccupation}
                onChange={(e) => onChange({ secondaryOccupation: e.target.value })}
                placeholder="Enter occupation"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="wiz-g2-income" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                Annual Income
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#76799C]">
                  ₹
                </span>
                <input
                  id="wiz-g2-income"
                  type="text"
                  value={state.secondaryAnnualIncome}
                  onChange={(e) => onChange({ secondaryAnnualIncome: e.target.value })}
                  placeholder="Enter annual income"
                  className={`${inputClass} pl-7`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="wiz-g2-email" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                Email Address
              </label>
              <input
                id="wiz-g2-email"
                type="email"
                value={state.secondaryEmail}
                onChange={(e) => onChange({ secondaryEmail: e.target.value })}
                placeholder="Enter email address"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="wiz-g2-phone" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                Phone Number
              </label>
              <input
                id="wiz-g2-phone"
                type="tel"
                value={state.secondaryPhone}
                onChange={(e) => onChange({ secondaryPhone: e.target.value })}
                placeholder="Enter phone number"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Guardian Address */}
        <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE]/70 p-4 space-y-3.5 dark:border-[#272B4D] dark:bg-[#10142C]/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
              <h4 className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Guardian Address{" "}
                <span className="font-medium text-[#76799C] dark:text-[#9DA6CC]">
                  (if different from student address)
                </span>
              </h4>
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#4D5072] cursor-pointer dark:text-[#C5CCF0]">
              <input
                type="checkbox"
                checked={state.sameAsStudentAddress}
                onChange={(e) => handleToggleSameAddress(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#663CF6]"
              />
              <span>Same as student address</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="wiz-g-addr1" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                Address Line 1
              </label>
              <input
                id="wiz-g-addr1"
                type="text"
                disabled={state.sameAsStudentAddress}
                value={state.sameAsStudentAddress ? state.studentAddressLine1 : state.guardianAddressLine1}
                onChange={(e) => onChange({ guardianAddressLine1: e.target.value })}
                placeholder="Enter address line 1"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="wiz-g-addr2" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                Address Line 2
              </label>
              <input
                id="wiz-g-addr2"
                type="text"
                disabled={state.sameAsStudentAddress}
                value={state.sameAsStudentAddress ? state.studentAddressLine2 : state.guardianAddressLine2}
                onChange={(e) => onChange({ guardianAddressLine2: e.target.value })}
                placeholder="Enter address line 2"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label htmlFor="wiz-g-city" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                City
              </label>
              <input
                id="wiz-g-city"
                type="text"
                disabled={state.sameAsStudentAddress}
                value={state.sameAsStudentAddress ? state.studentCity : state.guardianCity}
                onChange={(e) => onChange({ guardianCity: e.target.value })}
                placeholder="Enter city"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="wiz-g-state" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                State
              </label>
              <select
                id="wiz-g-state"
                disabled={state.sameAsStudentAddress}
                value={state.sameAsStudentAddress ? state.studentState : state.guardianState}
                onChange={(e) => onChange({ guardianState: e.target.value })}
                className={inputClass}
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="wiz-g-postal" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                Postal Code
              </label>
              <input
                id="wiz-g-postal"
                type="text"
                disabled={state.sameAsStudentAddress}
                value={state.sameAsStudentAddress ? state.studentPostalCode : state.guardianPostalCode}
                onChange={(e) => onChange({ guardianPostalCode: e.target.value })}
                placeholder="Enter postal code"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE]/70 p-4 space-y-3.5 dark:border-[#272B4D] dark:bg-[#10142C]/60">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#663CF6] dark:text-[#A78BFA]" aria-hidden="true" />
            <h4 className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Additional Information
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="wiz-emergency-phone" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                Emergency Contact Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="wiz-emergency-phone"
                type="tel"
                required
                value={state.emergencyContactNumber}
                onChange={(e) => onChange({ emergencyContactNumber: e.target.value })}
                placeholder="Enter emergency contact number"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="wiz-comm-mode" className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                Preferred Communication Mode <span className="text-rose-500">*</span>
              </label>
              <select
                id="wiz-comm-mode"
                value={state.preferredCommunicationMode}
                onChange={(e) =>
                  onChange({
                    preferredCommunicationMode: e.target.value as AdmissionCommunicationMode,
                  })
                }
                className={inputClass}
              >
                <option value="Phone">Phone</option>
                <option value="Email">Email</option>
                <option value="SMS">SMS</option>
                <option value="WhatsApp">WhatsApp</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
