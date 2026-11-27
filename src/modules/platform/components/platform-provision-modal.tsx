"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import type { SaaSPlanValue, SchoolStatusValue } from "@/modules/platform/types";

export function PlatformProvisionSchoolModal({
  open,
  onClose,
  onSuccess,
  onToast,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (schoolId: string) => Promise<void> | void;
  onToast: (type: "success" | "error", text: string) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    code: "",
    affiliationBoard: "CBSE",
    category: "Co-Educational School",
    contactPhone: "",
    contactEmail: "",
    city: "",
    state: "",
    plan: "STARTER" as SaaSPlanValue,
    status: "ACTIVE" as SchoolStatusValue,
    trialDays: 14,
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    adminPassword: "",
    adminRole: "PRINCIPAL" as "PRINCIPAL" | "SCHOOL_ADMIN",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/platform/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Failed to provision school.");
      }
      onToast(
        "success",
        `Provisioned ${json.entry.school.name} (${json.entry.school.uniqueId}).`,
      );
      setForm({
        name: "",
        code: "",
        affiliationBoard: "CBSE",
        category: "Co-Educational School",
        contactPhone: "",
        contactEmail: "",
        city: "",
        state: "",
        plan: "STARTER",
        status: "ACTIVE",
        trialDays: 14,
        adminName: "",
        adminEmail: "",
        adminPhone: "",
        adminPassword: "",
        adminRole: "PRINCIPAL",
      });
      onClose();
      await onSuccess(json.entry.school.id);
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Provisioning failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Provision New School"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[20px] border border-[#D6DBF0] bg-white p-6 shadow-2xl dark:border-[#272B4D] dark:bg-[#141731] space-y-4">
        <div className="flex items-center justify-between border-b border-[#DFE3F5] pb-3 dark:border-[#232746]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#663CF6]" />
            <h3 className="text-base font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Provision New School Tenant
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close provision modal"
            className="rounded-full p-1 text-[#76799C] hover:bg-[#FAF8FE] cursor-pointer dark:hover:bg-[#1B2042]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                School Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                Affiliation Board
              </label>
              <input
                type="text"
                value={form.affiliationBoard}
                onChange={(e) => setForm((p) => ({ ...p, affiliationBoard: e.target.value }))}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                School Phone *
              </label>
              <input
                type="tel"
                required
                value={form.contactPhone}
                onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                School Email
              </label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                City *
              </label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                State *
              </label>
              <input
                type="text"
                required
                value={form.state}
                onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                SaaS Plan
              </label>
              <select
                value={form.plan}
                onChange={(e) => setForm((p) => ({ ...p, plan: e.target.value as SaaSPlanValue }))}
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-bold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              >
                <option value="STARTER">Starter</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                Initial Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value as SchoolStatusValue }))
                }
                className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-bold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              >
                <option value="ACTIVE">Active</option>
                <option value="TRIAL">Trial</option>
              </select>
            </div>
          </div>

          <div className="border-t border-[#EEF1FA] pt-3 dark:border-[#232746]">
            <p className="text-xs font-extrabold text-[#08093B] mb-2 dark:text-[#F3F5FF]">
              Primary Administrator Account
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                  Admin Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.adminName}
                  onChange={(e) => setForm((p) => ({ ...p, adminName: e.target.value }))}
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                  Admin Role
                </label>
                <select
                  value={form.adminRole}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      adminRole: e.target.value as "PRINCIPAL" | "SCHOOL_ADMIN",
                    }))
                  }
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-bold text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                >
                  <option value="PRINCIPAL">Principal</option>
                  <option value="SCHOOL_ADMIN">School Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                  Admin Email *
                </label>
                <input
                  type="email"
                  required
                  value={form.adminEmail}
                  onChange={(e) => setForm((p) => ({ ...p, adminEmail: e.target.value }))}
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                  Admin Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={form.adminPhone}
                  onChange={(e) => setForm((p) => ({ ...p, adminPhone: e.target.value }))}
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]">
                  Initial Password (8+ chars) *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.adminPassword}
                  onChange={(e) => setForm((p) => ({ ...p, adminPassword: e.target.value }))}
                  className="w-full rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#CAD0EB] px-4 py-2 text-xs font-bold text-[#08093B] cursor-pointer dark:border-[#343B6B] dark:text-[#F3F5FF]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Provisioning..." : "Create School & Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
