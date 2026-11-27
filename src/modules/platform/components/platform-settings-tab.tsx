"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Fingerprint,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Server,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  SAAS_PLAN_CATALOG,
  type PlatformAdminPasskeyRecord,
  type PlatformOverviewData,
  type PlatformTab,
} from "@/modules/platform/types";
import {
  isWebAuthnSupported,
  registerPlatformPasskeyClient,
} from "@/modules/platform/lib/webauthn-client";
import { formatDateTime, formatInrFromPaise } from "./platform-shared";

export function PlatformSettingsTab({
  adminUser,
  overview,
  onNavigateTab,
  onToast,
}: {
  adminUser: {
    id: string;
    name: string;
    email: string | null;
    platformRole?: string;
    twoFactorEnabled?: boolean;
  };
  overview: PlatformOverviewData;
  onNavigateTab: (tab: PlatformTab) => void;
  onToast: (type: "success" | "error", text: string) => void;
}) {
  const [passkeys, setPasskeys] = useState<PlatformAdminPasskeyRecord[]>([]);
  const [deviceName, setDeviceName] = useState("Company Admin Passkey");
  const [addingPasskey, setAddingPasskey] = useState(false);
  const [webAuthnReady, setWebAuthnReady] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  const loadPasskeys = async () => {
    try {
      const res = await fetch("/api/platform/auth/passkey", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.passkeys)) {
          setPasskeys(json.passkeys);
        }
      }
    } catch {
      // legacy fallback users do not have platform_admin passkeys
    }
  };

  useEffect(() => {
    setWebAuthnReady(isWebAuthnSupported());
    void loadPasskeys();
  }, []);

  const handlePasswordRotate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPwd(true);
    try {
      const res = await fetch("/api/platform/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Failed to update password.");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onToast("success", "Company Admin password updated cleanly.");
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Password update failed.");
    } finally {
      setSavingPwd(false);
    }
  };

  const handleAddPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingPasskey(true);
    try {
      await registerPlatformPasskeyClient(deviceName);
      onToast("success", "Passkey enrolled for passwordless login & MFA.");
      await loadPasskeys();
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Passkey enrollment failed.");
    } finally {
      setAddingPasskey(false);
    }
  };

  const handleDeletePasskey = async (pk: PlatformAdminPasskeyRecord) => {
    try {
      const res = await fetch(
        `/api/platform/auth/passkey?id=${encodeURIComponent(pk.id)}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Unable to delete passkey.");
      }
      onToast("success", `Removed passkey "${pk.deviceName}".`);
      await loadPasskeys();
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Delete passkey failed.");
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              Company Portal &amp; Account Settings
            </h2>
            <p className="text-xs text-[#4D5072] dark:text-[#9DA6CC]">
              Manage your Company Admin credentials, biometrics/passkeys, 2FA verification, and SaaS tier reference defaults.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#EDE7FF] px-3 py-1 text-[11px] font-extrabold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Role: {adminUser.platformRole || "SUPER_ADMIN"}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] p-3.5 dark:border-[#272B4D] dark:bg-[#10142C]">
            <p className="text-[11px] font-bold text-[#76799C] dark:text-[#9DA6CC] flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[#663CF6]" />
              <span>Email Verification</span>
            </p>
            <p className="mt-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Verified ({adminUser.email || "Active"})</span>
            </p>
          </div>
          <div className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] p-3.5 dark:border-[#272B4D] dark:bg-[#10142C]">
            <p className="text-[11px] font-bold text-[#76799C] dark:text-[#9DA6CC] flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-[#663CF6]" />
              <span>MFA Policy</span>
            </p>
            <p className="mt-1 text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              {adminUser.twoFactorEnabled ? "TOTP 2FA Active" : "Passkey / MFA Verified"}
            </p>
          </div>
          <div className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] p-3.5 dark:border-[#272B4D] dark:bg-[#10142C]">
            <p className="text-[11px] font-bold text-[#76799C] dark:text-[#9DA6CC] flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-[#663CF6]" />
              <span>Environment</span>
            </p>
            <p className="mt-1 text-xs font-extrabold text-[#08093B] uppercase dark:text-[#F3F5FF]">
              {overview.health.environment} ·{" "}
              {overview.health.databaseConnected ? "PostgreSQL Connected" : "In-Memory Fallback"}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Password Rotation */}
        <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
          <h3 className="text-sm font-extrabold text-[#08093B] flex items-center gap-1.5 dark:text-[#F3F5FF]">
            <Lock className="h-4 w-4 text-[#663CF6]" />
            <span>Rotate Admin Password</span>
          </h3>
          <form onSubmit={handlePasswordRotate} className="space-y-3">
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current Password"
              aria-label="Current password"
              className="w-full rounded-xl border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-2 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            />
            <input
              type="password"
              required
              minLength={12}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Strong Password (12+ chars, Aa1!)"
              aria-label="New strong password"
              className="w-full rounded-xl border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-2 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm New Password"
              aria-label="Confirm new password"
              className="w-full rounded-xl border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-2 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
            />
            <button
              type="submit"
              disabled={savingPwd}
              className="rounded-xl bg-[#663CF6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4F27E8] disabled:opacity-50 cursor-pointer"
            >
              {savingPwd ? "Updating..." : "Update Password"}
            </button>
          </form>
        </section>

        {/* Passkey Devices */}
        <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-[#08093B] flex items-center gap-1.5 dark:text-[#F3F5FF]">
              <Fingerprint className="h-4 w-4 text-[#663CF6]" />
              <span>Registered Passkeys ({passkeys.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab("admins")}
              className="text-[11px] font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
            >
              Manage Team →
            </button>
          </div>

          {webAuthnReady && (
            <form onSubmit={handleAddPasskey} className="flex gap-2">
              <input
                type="text"
                required
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                aria-label="New passkey device label"
                className="flex-1 rounded-xl border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-2 text-xs text-[#08093B] dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              />
              <button
                type="submit"
                disabled={addingPasskey}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#663CF6] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#4F27E8] disabled:opacity-50 cursor-pointer"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>{addingPasskey ? "Adding..." : "Enroll Passkey"}</span>
              </button>
            </form>
          )}

          {passkeys.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#DFE3F5] p-4 text-center text-xs text-[#76799C] dark:border-[#272B4D] dark:text-[#9DA6CC]">
              No hardware or biometric passkeys enrolled yet.
            </p>
          ) : (
            <div className="space-y-2">
              {passkeys.map((pk) => (
                <div
                  key={pk.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[#DFE3F5] bg-[#FAF8FE] px-3 py-2 text-xs dark:border-[#272B4D] dark:bg-[#10142C]"
                >
                  <div>
                    <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">{pk.deviceName}</p>
                    <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                      Last used: {formatDateTime(pk.lastUsedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeletePasskey(pk)}
                    aria-label={`Delete passkey ${pk.deviceName}`}
                    className="rounded p-1 text-[#76799C] hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* SaaS Plan Tier Catalog Matrix */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
              SaaS Plan Catalog &amp; Quota Defaults
            </h3>
            <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
              Used automatically when provisioning new tenants and computing platform MRR.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("billing")}
            className="text-xs font-bold text-[#663CF6] hover:underline cursor-pointer dark:text-[#C4B5FD]"
          >
            Open Billing →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(["STARTER", "PROFESSIONAL", "ENTERPRISE"] as const).map((key) => {
            const cat = SAAS_PLAN_CATALOG[key];
            return (
              <div
                key={key}
                className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] p-4 dark:border-[#272B4D] dark:bg-[#10142C]"
              >
                <p className="text-xs font-extrabold text-[#663CF6] dark:text-[#C4B5FD]">
                  {cat.name}
                </p>
                <p className="mt-1 text-lg font-black text-[#08093B] dark:text-[#F3F5FF]">
                  {formatInrFromPaise(cat.monthlyPaise)}
                  <span className="text-xs font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                    /mo
                  </span>
                </p>
                <p className="mt-1 text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                  Yearly: {formatInrFromPaise(cat.yearlyMonthlyEquivalentPaise)}/mo · Up to{" "}
                  {cat.defaultMaxStudents.toLocaleString("en-IN")} students &amp;{" "}
                  {cat.defaultMaxStaff.toLocaleString("en-IN")} staff
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
