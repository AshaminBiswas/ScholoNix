"use client";

import React, { useEffect, useState } from "react";
import {
  Fingerprint,
  KeyRound,
  Lock,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import type {
  PlatformAdminPasskeyRecord,
  PlatformAdminRecord,
  PlatformAdminRoleValue,
  PlatformAdminStatusValue,
} from "@/modules/platform/types";
import {
  isWebAuthnSupported,
  registerPlatformPasskeyClient,
} from "@/modules/platform/lib/webauthn-client";
import { formatDateTime } from "./platform-shared";

const ROLE_DESCRIPTIONS: Record<PlatformAdminRoleValue, string> = {
  SUPER_ADMIN: "Full access + manage Company Admins & delete tenants",
  OPERATIONS: "Provision/manage schools, tenant users & admissions data",
  BILLING_MANAGER: "Manage SaaS plans, limits & subscription invoices",
  SUPPORT_AGENT: "Inspect schools & resolve support/feedback tickets",
};

export function PlatformAdminsTab({
  currentAdminId,
  currentPlatformRole,
  currentTwoFactorEnabled,
  onToast,
}: {
  currentAdminId: string;
  currentPlatformRole: PlatformAdminRoleValue;
  currentTwoFactorEnabled?: boolean;
  onToast: (type: "success" | "error", text: string) => void;
}) {
  const [admins, setAdmins] = useState<PlatformAdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Management");
  const [role, setRole] = useState<PlatformAdminRoleValue>("OPERATIONS");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);

  const [myPasskeys, setMyPasskeys] = useState<PlatformAdminPasskeyRecord[]>([]);
  const [passkeyDeviceName, setPasskeyDeviceName] = useState("Backup Device Passkey");
  const [addingPasskey, setAddingPasskey] = useState(false);
  const [webAuthnReady, setWebAuthnReady] = useState(false);

  const canManageTeam = currentPlatformRole === "SUPER_ADMIN";

  useEffect(() => {
    setWebAuthnReady(isWebAuthnSupported());
  }, []);

  const loadAdminsAndPasskeys = async () => {
    setLoading(true);
    try {
      const [adminsRes, passkeysRes] = await Promise.all([
        fetch("/api/platform/admins", { cache: "no-store" }),
        fetch("/api/platform/auth/passkey", { cache: "no-store" }),
      ]);
      const adminsJson = await adminsRes.json();
      if (adminsJson.success && Array.isArray(adminsJson.admins)) {
        setAdmins(adminsJson.admins);
      }
      if (passkeysRes.ok) {
        const pkJson = await passkeysRes.json();
        if (pkJson.success && Array.isArray(pkJson.passkeys)) {
          setMyPasskeys(pkJson.passkeys);
        }
      }
    } catch {
      // ignore transient
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminsAndPasskeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/platform/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          department,
          role,
          password,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Failed to create company admin.");
      }
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      onToast(
        "success",
        `Added ${json.admin.name} (${json.admin.role}). Password change + 2FA/Passkey enforced on first login.`,
      );
      await loadAdminsAndPasskeys();
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Failed to create company admin.");
    } finally {
      setCreating(false);
    }
  };

  const handlePatchAdmin = async (
    adminId: string,
    payload: {
      role?: PlatformAdminRoleValue;
      status?: PlatformAdminStatusValue;
      revokeSessions?: boolean;
      forcePasswordReset?: boolean;
      resetMfa?: boolean;
    },
    successMsg: string,
  ) => {
    try {
      const res = await fetch("/api/platform/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, ...payload }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Update failed.");
      }
      onToast("success", successMsg);
      await loadAdminsAndPasskeys();
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Update failed.");
    }
  };

  const handleDeleteAdmin = async (admin: PlatformAdminRecord) => {
    try {
      const res = await fetch(`/api/platform/admins?id=${encodeURIComponent(admin.id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Delete failed.");
      }
      onToast("success", `Removed ${admin.name} from Company Admins.`);
      await loadAdminsAndPasskeys();
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Delete failed.");
    }
  };

  const handleAddPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingPasskey(true);
    try {
      await registerPlatformPasskeyClient(passkeyDeviceName);
      onToast("success", "New Passkey registered for your Company Admin account.");
      await loadAdminsAndPasskeys();
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Passkey registration failed.");
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
        throw new Error(json?.error?.message || "Failed to remove passkey.");
      }
      onToast("success", `Removed passkey "${pk.deviceName}".`);
      await loadAdminsAndPasskeys();
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Failed to remove passkey.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Role Matrix */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-4 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#663CF6]" />
              <h2 className="text-lg font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                Company Admins &amp; Management Team
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-[#76799C] dark:text-[#9DA6CC]">
              First-time sign-in enforces password change + Two-Factor Auth (TOTP) or Passkey verification.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#EDE7FF] px-3 py-1 text-[11px] font-extrabold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
            <KeyRound className="h-3.5 w-3.5" />
            <span>Your Role: {currentPlatformRole}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {(Object.keys(ROLE_DESCRIPTIONS) as PlatformAdminRoleValue[]).map((r) => (
            <div
              key={r}
              className="rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE] p-3 dark:border-[#272B4D] dark:bg-[#10142C]"
            >
              <p className="text-xs font-extrabold text-[#663CF6] dark:text-[#C4B5FD]">{r}</p>
              <p className="mt-1 text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                {ROLE_DESCRIPTIONS[r]}
              </p>
            </div>
          ))}
        </div>

        {/* Create Company Admin Form (SUPER_ADMIN only) */}
        {canManageTeam && (
          <form
            onSubmit={handleCreate}
            className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE]/80 p-4 space-y-3 dark:border-[#272B4D] dark:bg-[#10142C]"
          >
            <p className="text-xs font-extrabold text-[#08093B] flex items-center gap-1.5 dark:text-[#F3F5FF]">
              <UserPlus className="h-4 w-4 text-[#663CF6]" />
              <span>Add Company Admin / Management Member</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name *"
                aria-label="New company admin name"
                className="rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Company Email *"
                aria-label="New company admin email"
                className="rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone (optional)"
                aria-label="New company admin phone"
                className="rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
              />
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Department"
                aria-label="New company admin department"
                className="rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as PlatformAdminRoleValue)}
                aria-label="New company admin role"
                className="rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-bold dark:border-[#343B6B] dark:bg-[#141731]"
              >
                <option value="OPERATIONS">OPERATIONS</option>
                <option value="BILLING_MANAGER">BILLING_MANAGER</option>
                <option value="SUPPORT_AGENT">SUPPORT_AGENT</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              </select>
              <div className="flex gap-1.5">
                <input
                  type="password"
                  required
                  minLength={10}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Temp Password (10+)"
                  aria-label="New company admin password"
                  className="flex-1 min-w-0 rounded-xl border border-[#CAD0EB] bg-white px-2.5 py-2 text-xs dark:border-[#343B6B] dark:bg-[#141731]"
                />
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#663CF6] px-3 py-2 text-xs font-bold text-white hover:bg-[#4F27E8] disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{creating ? "..." : "Add"}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </section>

      {/* Personal Security & Passkeys */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs space-y-3 dark:border-[#272B4D] dark:bg-[#141731]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-[#08093B] flex items-center gap-1.5 dark:text-[#F3F5FF]">
              <Fingerprint className="h-4 w-4 text-[#663CF6]" />
              <span>Your MFA &amp; Passkeys</span>
            </h3>
            <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
              Authenticator 2FA:{" "}
              <strong className="font-bold">
                {currentTwoFactorEnabled ? "Enabled" : "Not set"}
              </strong>{" "}
              · Registered Passkeys: <strong className="font-bold">{myPasskeys.length}</strong>
            </p>
          </div>

          {webAuthnReady && (
            <form onSubmit={handleAddPasskey} className="flex items-center gap-2">
              <input
                type="text"
                required
                value={passkeyDeviceName}
                onChange={(e) => setPasskeyDeviceName(e.target.value)}
                aria-label="Passkey device label"
                className="rounded-xl border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-1.5 text-xs dark:border-[#343B6B] dark:bg-[#10142C]"
              />
              <button
                type="submit"
                disabled={addingPasskey}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#663CF6] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#4F27E8] disabled:opacity-50 cursor-pointer"
              >
                <Fingerprint className="h-3.5 w-3.5" />
                <span>{addingPasskey ? "Registering..." : "Add Passkey"}</span>
              </button>
            </form>
          )}
        </div>

        {myPasskeys.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {myPasskeys.map((pk) => (
              <div
                key={pk.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-[#DFE3F5] bg-[#FAF8FE] px-3 py-2 text-xs dark:border-[#272B4D] dark:bg-[#10142C]"
              >
                <div className="min-w-0">
                  <p className="font-bold text-[#08093B] truncate dark:text-[#F3F5FF]">
                    {pk.deviceName}
                  </p>
                  <p className="text-[10px] text-[#76799C] dark:text-[#9DA6CC]">
                    Last used: {formatDateTime(pk.lastUsedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeletePasskey(pk)}
                  aria-label={`Remove passkey ${pk.deviceName}`}
                  className="rounded p-1 text-[#76799C] hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Admins List */}
      <section className="rounded-[20px] border border-[#D6DBF0] bg-white p-5 shadow-xs dark:border-[#272B4D] dark:bg-[#141731]">
        {loading ? (
          <p className="py-6 text-center text-xs text-[#76799C]">Loading company admins...</p>
        ) : admins.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
              No entries found in <code className="font-mono">platform_admins</code> yet.
            </p>
            <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
              Run <code className="font-mono">node scripts/create-platform-admin.mjs</code> or add your first Super Admin above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[12px] border border-[#DFE3F5] dark:border-[#272B4D]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F6F5FD] text-[10px] font-bold uppercase text-[#4D5072] border-b border-[#DFE3F5] dark:bg-[#1B1F3F] dark:text-[#B4BDD9] dark:border-[#272B4D]">
                <tr>
                  <th className="px-3 py-2">Company Admin</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Security</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Last Login</th>
                  <th className="px-3 py-2 text-center">Sessions</th>
                  {canManageTeam && <th className="px-3 py-2 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FA] dark:divide-[#232746]">
                {admins.map((a) => {
                  const isSelf = a.id === currentAdminId;
                  return (
                    <tr key={a.id}>
                      <td className="px-3 py-2">
                        <p className="font-bold text-[#08093B] dark:text-[#F3F5FF]">
                          {a.name}{" "}
                          {isSelf && (
                            <span className="ml-1 rounded bg-[#EDE7FF] px-1.5 py-0.5 text-[9px] text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                              YOU
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-[#76799C] dark:text-[#9DA6CC]">
                          {a.email} {a.phone ? `· ${a.phone}` : ""} {a.department ? `· ${a.department}` : ""}
                        </p>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          aria-label={`Role for ${a.name}`}
                          disabled={!canManageTeam || isSelf}
                          value={a.role}
                          onChange={(e) =>
                            void handlePatchAdmin(
                              a.id,
                              { role: e.target.value as PlatformAdminRoleValue },
                              `Updated ${a.name} role to ${e.target.value}.`,
                            )
                          }
                          className="rounded-lg border border-[#CAD0EB] bg-white px-2 py-1 text-[11px] font-bold disabled:opacity-60 dark:border-[#343B6B] dark:bg-[#10142C]"
                        >
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          <option value="OPERATIONS">OPERATIONS</option>
                          <option value="BILLING_MANAGER">BILLING_MANAGER</option>
                          <option value="SUPPORT_AGENT">SUPPORT_AGENT</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {a.mustChangePassword && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              Pw Reset Pending
                            </span>
                          )}
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              a.emailVerifiedAt
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            }`}
                          >
                            {a.emailVerifiedAt ? "Email ✓" : "Email Pending"}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              a.phoneVerifiedAt
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            }`}
                          >
                            {a.phoneVerifiedAt ? "Phone ✓" : "Phone Pending"}
                          </span>
                          {a.twoFactorEnabled && (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              TOTP 2FA
                            </span>
                          )}
                          {(a.passkeyCount ?? 0) > 0 && (
                            <span className="rounded bg-[#EDE7FF] px-1.5 py-0.5 text-[10px] font-bold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
                              Passkey ({a.passkeyCount})
                            </span>
                          )}
                          {!a.twoFactorEnabled && (a.passkeyCount ?? 0) === 0 && (
                            <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                              MFA Unenrolled
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          aria-label={`Status for ${a.name}`}
                          disabled={!canManageTeam || isSelf}
                          value={a.status}
                          onChange={(e) =>
                            void handlePatchAdmin(
                              a.id,
                              { status: e.target.value as PlatformAdminStatusValue },
                              `Updated ${a.name} status to ${e.target.value}.`,
                            )
                          }
                          className="rounded-lg border border-[#CAD0EB] bg-white px-2 py-1 text-[11px] font-bold disabled:opacity-60 dark:border-[#343B6B] dark:bg-[#10142C]"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="SUSPENDED">SUSPENDED</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(a.lastLoginAt)}</td>
                      <td className="px-3 py-2 text-center font-bold">{a.activeSessionCount ?? 0}</td>
                      {canManageTeam && (
                        <td className="px-3 py-2 text-right whitespace-nowrap space-x-1">
                          <button
                            type="button"
                            onClick={() =>
                              void handlePatchAdmin(
                                a.id,
                                { revokeSessions: true },
                                `Revoked sessions for ${a.name}.`,
                              )
                            }
                            className="inline-flex items-center gap-1 rounded border border-[#CAD0EB] px-2 py-1 text-[10px] font-bold cursor-pointer dark:border-[#343B6B]"
                          >
                            <Lock className="h-3 w-3" />
                            <span>Revoke</span>
                          </button>
                          {!isSelf && (
                            <>
                              <button
                                type="button"
                                title="Force password change + reset 2FA on next login"
                                onClick={() =>
                                  void handlePatchAdmin(
                                    a.id,
                                    { forcePasswordReset: true, resetMfa: true },
                                    `Reset security gates for ${a.name}. Next login requires password change + 2FA/Passkey setup.`,
                                  )
                                }
                                className="inline-flex items-center gap-1 rounded border border-[#CAD0EB] px-2 py-1 text-[10px] font-bold cursor-pointer dark:border-[#343B6B]"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Reset 2FA</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteAdmin(a)}
                                aria-label={`Delete company admin ${a.name}`}
                                className="inline-flex items-center justify-center rounded p-1 text-[#76799C] hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
