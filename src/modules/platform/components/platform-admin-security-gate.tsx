"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Fingerprint,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { PlatformAdminRoleValue } from "@/modules/platform/types";
import {
  authenticatePlatformPasskeyClient,
  isWebAuthnSupported,
  registerPlatformPasskeyClient,
} from "@/modules/platform/lib/webauthn-client";

interface GateAdminState {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: PlatformAdminRoleValue;
  mustChangePassword: boolean;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  twoFactorEnabled: boolean;
  passkeyCount: number;
}

export function PlatformAdminSecurityGate({
  admin,
  mfaVerified: initialMfaVerified,
  targetPath,
}: {
  admin: GateAdminState;
  mfaVerified: boolean;
  targetPath: string;
}) {
  const router = useRouter();
  const [stateAdmin, setStateAdmin] = useState<GateAdminState>(admin);
  const [mfaVerified, setMfaVerified] = useState<boolean>(initialMfaVerified);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Step 1: Forced Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);

  // Step 2: Enrollment choice
  const [enrollTab, setEnrollTab] = useState<"totp" | "passkey">("totp");
  const [totpSecret, setTotpSecret] = useState<string>("");
  const [otpauthUri, setOtpauthUri] = useState<string>("");
  const [loadingTotp, setLoadingTotp] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [confirmingTotp, setConfirmingTotp] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Passkey enrollment/verification
  const [deviceName, setDeviceName] = useState("Company Admin Security Passkey");
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [webAuthnReady, setWebAuthnReady] = useState(false);

  // Returning MFA verification
  const [challengeCode, setChallengeCode] = useState("");
  const [verifyingChallenge, setVerifyingChallenge] = useState(false);

  // Step 2: Email & Phone OTP verification
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  const [phoneInput, setPhoneInput] = useState(admin.phone || "");
  const [phoneOtpCode, setPhoneOtpCode] = useState("");
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [phoneCooldown, setPhoneCooldown] = useState(0);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);

  useEffect(() => {
    setWebAuthnReady(isWebAuthnSupported());
  }, []);

  useEffect(() => {
    if (emailCooldown <= 0 && phoneCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setEmailCooldown((c) => (c > 0 ? c - 1 : 0));
      setPhoneCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [emailCooldown, phoneCooldown]);

  const contactsVerified =
    Boolean(stateAdmin.emailVerifiedAt) && Boolean(stateAdmin.phoneVerifiedAt);
  const hasAnyMfa = stateAdmin.twoFactorEnabled || stateAdmin.passkeyCount > 0;
  const phase: "password" | "contacts" | "enroll" | "verify" | "complete" =
    stateAdmin.mustChangePassword
      ? "password"
      : !contactsVerified
        ? "contacts"
        : !hasAnyMfa
          ? "enroll"
          : !mfaVerified
            ? "verify"
            : "complete";

  useEffect(() => {
    if (phase === "enroll" && enrollTab === "totp" && !totpSecret && !loadingTotp) {
      setLoadingTotp(true);
      fetch("/api/platform/auth/mfa/totp", { cache: "no-store" })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setTotpSecret(json.secret);
            setOtpauthUri(json.otpauthUri);
          } else {
            setError(json?.error?.message || "Failed to generate authenticator secret.");
          }
        })
        .catch(() => setError("Unable to load 2FA setup details."))
        .finally(() => setLoadingTotp(false));
    }
  }, [phase, enrollTab, totpSecret, loadingTotp]);

  const handleSignOut = async () => {
    try {
      await fetch("/api/platform/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.refresh();
  };

  const pwdChecks = {
    length: newPassword.length >= 12,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
    matches: newPassword.length > 0 && newPassword === confirmPassword,
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setChangingPwd(true);
    try {
      const res = await fetch("/api/platform/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Password change failed.");
      }
      setStateAdmin((prev) => ({
        ...prev,
        mustChangePassword: Boolean(json.admin.mustChangePassword),
        emailVerifiedAt: json.admin.emailVerifiedAt ?? prev.emailVerifiedAt,
        phoneVerifiedAt: json.admin.phoneVerifiedAt ?? prev.phoneVerifiedAt,
        twoFactorEnabled: Boolean(json.admin.twoFactorEnabled),
        passkeyCount: Number(json.admin.passkeyCount ?? prev.passkeyCount),
      }));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice(
        json.requiresContactVerification
          ? "Initial password updated. Next, verify your email and phone number."
          : "Initial password updated. Complete MFA/Passkey security to unlock the panel.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password change failed.");
    } finally {
      setChangingPwd(false);
    }
  };

  const handleSendContactOtp = async (channel: "EMAIL" | "SMS") => {
    setError(null);
    setNotice(null);
    if (channel === "EMAIL") setEmailSending(true);
    else setPhoneSending(true);
    try {
      const res = await fetch("/api/platform/auth/verify-contact/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          channel === "EMAIL" ? { channel } : { channel, phone: phoneInput.trim() },
        ),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Failed to send verification OTP.");
      }
      if (channel === "EMAIL") {
        setEmailOtpSent(true);
        setEmailCooldown(Number(json.cooldownSeconds || 60));
      } else {
        setPhoneOtpSent(true);
        setPhoneCooldown(Number(json.cooldownSeconds || 60));
        if (json.phone) {
          setPhoneInput(json.phone);
          setStateAdmin((prev) => ({ ...prev, phone: json.phone }));
        }
      }
      setNotice(`6-digit verification code sent to ${json.destinationMasked}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send verification code.");
    } finally {
      if (channel === "EMAIL") setEmailSending(false);
      else setPhoneSending(false);
    }
  };

  const handleVerifyContactOtp = async (channel: "EMAIL" | "SMS", e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (channel === "EMAIL") setEmailVerifying(true);
    else setPhoneVerifying(true);
    try {
      const res = await fetch("/api/platform/auth/verify-contact/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          channel === "EMAIL"
            ? { channel, code: emailOtpCode.trim() }
            : { channel, code: phoneOtpCode.trim(), phone: phoneInput.trim() },
        ),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Verification failed.");
      }
      setStateAdmin((prev) => ({
        ...prev,
        phone: json.admin.phone ?? prev.phone,
        emailVerifiedAt: json.admin.emailVerifiedAt ?? prev.emailVerifiedAt,
        phoneVerifiedAt: json.admin.phoneVerifiedAt ?? prev.phoneVerifiedAt,
        twoFactorEnabled: Boolean(json.admin.twoFactorEnabled),
        passkeyCount: Number(json.admin.passkeyCount ?? prev.passkeyCount),
      }));
      if (channel === "EMAIL") setEmailOtpCode("");
      else setPhoneOtpCode("");
      setNotice(
        channel === "EMAIL"
          ? "Company email verified successfully."
          : "Mobile phone number verified successfully.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed.");
    } finally {
      if (channel === "EMAIL") setEmailVerifying(false);
      else setPhoneVerifying(false);
    }
  };

  const handleConfirmTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConfirmingTotp(true);
    try {
      const res = await fetch("/api/platform/auth/mfa/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: totpSecret, code: totpCode.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Verification code failed.");
      }
      setRecoveryCodes(json.recoveryCodes || []);
      setStateAdmin((prev) => ({ ...prev, twoFactorEnabled: true }));
      setMfaVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify authenticator code.");
    } finally {
      setConfirmingTotp(false);
    }
  };

  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPasskeyBusy(true);
    try {
      const json = await registerPlatformPasskeyClient(deviceName);
      setStateAdmin((prev) => ({
        ...prev,
        passkeyCount: Number(json.admin?.passkeyCount ?? prev.passkeyCount + 1),
      }));
      setMfaVerified(true);
      router.replace((json.redirectTo || targetPath) as never);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Passkey registration failed.");
    } finally {
      setPasskeyBusy(false);
    }
  };

  const handleVerifyTotpChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVerifyingChallenge(true);
    try {
      const res = await fetch("/api/platform/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: challengeCode.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Invalid 2FA code.");
      }
      setMfaVerified(true);
      router.replace((json.redirectTo || targetPath) as never);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify 2FA.");
    } finally {
      setVerifyingChallenge(false);
    }
  };

  const handleVerifyPasskeyChallenge = async () => {
    setError(null);
    setPasskeyBusy(true);
    try {
      const json = await authenticatePlatformPasskeyClient(stateAdmin.email);
      setMfaVerified(true);
      router.replace((json.redirectTo || targetPath) as never);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Passkey verification failed.");
    } finally {
      setPasskeyBusy(false);
    }
  };

  const copyText = async (text: string, which: "secret" | "codes") => {
    await navigator.clipboard.writeText(text);
    if (which === "secret") {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  const downloadRecoveryCodes = () => {
    if (!recoveryCodes) return;
    const content = [
      "ScholoNix Company Admin Recovery Codes",
      `Account: ${stateAdmin.email}`,
      `Generated: ${new Date().toISOString()}`,
      "",
      ...recoveryCodes,
      "",
      "Store these offline in a password manager. Each code works once.",
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scholonix-recovery-codes-${stateAdmin.email.split("@")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-screen bg-[#F4F6FC] flex items-center justify-center p-4 dark:bg-[#090B1A]">
      <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
        <ThemeToggle />
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#D6DBF0] bg-white px-3 py-2 text-xs font-bold text-rose-600 shadow-xs hover:bg-rose-50 cursor-pointer dark:border-[#272B4D] dark:bg-[#141731] dark:text-rose-400"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="w-full max-w-lg rounded-[24px] border border-[#D6DBF0] bg-white p-6 sm:p-8 shadow-xl dark:border-[#272B4D] dark:bg-[#141731] space-y-5">
        <div className="flex flex-col items-center text-center">
          <BrandLogo className="h-9" asLink={false} />
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#EDE7FF] px-3 py-1 text-[11px] font-extrabold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Company Admin Security Gate</span>
          </span>
          <h1 className="mt-3 text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            {phase === "password"
              ? "Change Initial Password"
              : phase === "contacts"
                ? "Verify Email & Phone Number"
                : phase === "enroll"
                  ? "Set Up Two-Factor Auth or Passkey"
                  : phase === "verify"
                    ? "Verify Your Identity"
                    : "Security Setup Complete"}
          </h1>
          <p className="mt-1 text-xs text-[#4D5072] dark:text-[#9DA6CC]">
            Signed in as <strong className="font-bold text-[#08093B] dark:text-[#F3F5FF]">{stateAdmin.name}</strong> ({stateAdmin.email})
          </p>
        </div>

        {/* 3-Step Onboarding Progress Indicator */}
        <div className="grid grid-cols-3 gap-2 text-[11px] font-bold">
          <div
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 ${
              !stateAdmin.mustChangePassword
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-[#663CF6] bg-[#EDE7FF]/60 text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]"
            }`}
          >
            {!stateAdmin.mustChangePassword ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <Lock className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>1. Password</span>
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 ${
              contactsVerified
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                : !stateAdmin.mustChangePassword
                  ? "border-[#663CF6] bg-[#EDE7FF]/60 text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]"
                  : "border-[#DFE3F5] bg-[#FAF8FE] text-[#76799C] dark:border-[#272B4D] dark:bg-[#10142C] dark:text-[#9DA6CC]"
            }`}
          >
            {contactsVerified ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <Mail className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>2. Email &amp; Phone</span>
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 ${
              mfaVerified && hasAnyMfa
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                : !stateAdmin.mustChangePassword && contactsVerified
                  ? "border-[#663CF6] bg-[#EDE7FF]/60 text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]"
                  : "border-[#DFE3F5] bg-[#FAF8FE] text-[#76799C] dark:border-[#272B4D] dark:bg-[#10142C] dark:text-[#9DA6CC]"
            }`}
          >
            {mfaVerified && hasAnyMfa ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <KeyRound className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>3. 2FA / Passkey</span>
          </div>
        </div>

        {notice && (
          <div className="flex items-center gap-2 rounded-[12px] border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-[12px] border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* PHASE 1: MANDATORY PASSWORD CHANGE */}
        {phase === "password" && (
          <form onSubmit={handlePasswordChange} className="space-y-3.5">
            <div>
              <label
                htmlFor="chpwd-current"
                className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
              >
                Current / Temporary Password
              </label>
              <input
                id="chpwd-current"
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-[12px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-2.5 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:bg-white focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              />
            </div>

            <div>
              <label
                htmlFor="chpwd-new"
                className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
              >
                New Strong Password
              </label>
              <input
                id="chpwd-new"
                type="password"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-[12px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-2.5 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:bg-white focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              />
            </div>

            <div>
              <label
                htmlFor="chpwd-confirm"
                className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
              >
                Confirm New Password
              </label>
              <input
                id="chpwd-confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-[12px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-2.5 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:bg-white focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5 rounded-[12px] border border-[#DFE3F5] bg-[#FAF8FE] p-3 text-[11px] dark:border-[#272B4D] dark:bg-[#10142C]">
              {[
                ["12+ characters", pwdChecks.length],
                ["Uppercase letter", pwdChecks.upper],
                ["Lowercase letter", pwdChecks.lower],
                ["Number (0-9)", pwdChecks.number],
                ["Special symbol", pwdChecks.special],
                ["Passwords match", pwdChecks.matches],
              ].map(([label, ok]) => (
                <div
                  key={String(label)}
                  className={`flex items-center gap-1.5 font-semibold ${
                    ok
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-[#76799C] dark:text-[#9DA6CC]"
                  }`}
                >
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={changingPwd}
              className="w-full inline-flex items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-60 cursor-pointer"
            >
              {changingPwd && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{changingPwd ? "Updating Password..." : "Update Password & Continue"}</span>
            </button>
          </form>
        )}

        {/* PHASE 2: MANDATORY EMAIL & PHONE VERIFICATION */}
        {phase === "contacts" && (
          <div className="space-y-4">
            {/* Email Card */}
            <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE] p-4 space-y-2.5 dark:border-[#272B4D] dark:bg-[#10142C]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="h-4 w-4 shrink-0 text-[#663CF6]" />
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                      Company Email Address
                    </p>
                    <p className="text-[11px] text-[#4D5072] truncate dark:text-[#9DA6CC]">
                      {stateAdmin.email}
                    </p>
                  </div>
                </div>
                {stateAdmin.emailVerifiedAt ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={emailSending || emailCooldown > 0}
                    onClick={() => void handleSendContactOtp("EMAIL")}
                    className="shrink-0 rounded-lg bg-[#663CF6] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#4F27E8] disabled:opacity-60 cursor-pointer"
                  >
                    {emailSending
                      ? "Sending..."
                      : emailCooldown > 0
                        ? `Resend (${emailCooldown}s)`
                        : emailOtpSent
                          ? "Resend OTP"
                          : "Send Email OTP"}
                  </button>
                )}
              </div>

              {!stateAdmin.emailVerifiedAt && (
                <form
                  onSubmit={(e) => void handleVerifyContactOtp("EMAIL", e)}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    required
                    value={emailOtpCode}
                    onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="6-digit Email OTP"
                    aria-label="Email verification OTP"
                    className="flex-1 rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 font-mono text-xs font-bold tracking-widest text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
                  />
                  <button
                    type="submit"
                    disabled={emailVerifying || emailOtpCode.length !== 6}
                    className="rounded-xl border border-[#663CF6] px-3.5 py-2 text-xs font-bold text-[#663CF6] hover:bg-[#EDE7FF]/60 disabled:opacity-50 cursor-pointer dark:text-[#C4B5FD] dark:hover:bg-[#251D4A]"
                  >
                    {emailVerifying ? "Verifying..." : "Verify Email"}
                  </button>
                </form>
              )}
            </div>

            {/* Phone Card */}
            <div className="rounded-[16px] border border-[#DFE3F5] bg-[#FAF8FE] p-4 space-y-2.5 dark:border-[#272B4D] dark:bg-[#10142C]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="h-4 w-4 shrink-0 text-[#663CF6]" />
                  <div>
                    <p className="text-xs font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                      Mobile Phone Number
                    </p>
                    <p className="text-[11px] text-[#4D5072] dark:text-[#9DA6CC]">
                      {stateAdmin.phoneVerifiedAt
                        ? stateAdmin.phone
                        : "Enter mobile number with country code to receive SMS OTP"}
                    </p>
                  </div>
                </div>
                {stateAdmin.phoneVerifiedAt && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified</span>
                  </span>
                )}
              </div>

              {!stateAdmin.phoneVerifiedAt && (
                <>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="+91 9876543210"
                      aria-label="Company admin mobile phone number"
                      className="flex-1 rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
                    />
                    <button
                      type="button"
                      disabled={phoneSending || phoneCooldown > 0 || !phoneInput.trim()}
                      onClick={() => void handleSendContactOtp("SMS")}
                      className="shrink-0 rounded-xl bg-[#663CF6] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#4F27E8] disabled:opacity-60 cursor-pointer"
                    >
                      {phoneSending
                        ? "Sending..."
                        : phoneCooldown > 0
                          ? `Resend (${phoneCooldown}s)`
                          : phoneOtpSent
                            ? "Resend SMS"
                            : "Send SMS OTP"}
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => void handleVerifyContactOtp("SMS", e)}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      required
                      value={phoneOtpCode}
                      onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="6-digit SMS OTP"
                      aria-label="SMS verification OTP"
                      className="flex-1 rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 font-mono text-xs font-bold tracking-widest text-[#08093B] focus:border-[#663CF6] focus:outline-none dark:border-[#343B6B] dark:bg-[#141731] dark:text-[#F3F5FF]"
                    />
                    <button
                      type="submit"
                      disabled={phoneVerifying || phoneOtpCode.length !== 6}
                      className="rounded-xl border border-[#663CF6] px-3.5 py-2 text-xs font-bold text-[#663CF6] hover:bg-[#EDE7FF]/60 disabled:opacity-50 cursor-pointer dark:text-[#C4B5FD] dark:hover:bg-[#251D4A]"
                    >
                      {phoneVerifying ? "Verifying..." : "Verify Phone"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

        {/* RECOVERY CODES DISPLAY AFTER TOTP ENROLLMENT */}
        {recoveryCodes && (
          <div className="space-y-4">
            <div className="rounded-[14px] border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              <p className="font-extrabold">Save your 8 single-use recovery codes now!</p>
              <p className="mt-1 text-[11px]">
                If you lose your authenticator app, these codes are the only offline way back in.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] p-3 font-mono text-xs font-bold text-[#08093B] dark:border-[#272B4D] dark:bg-[#10142C] dark:text-[#F3F5FF]">
              {recoveryCodes.map((code) => (
                <div key={code} className="rounded-lg bg-white px-2.5 py-1.5 text-center dark:bg-[#181C3B]">
                  {code}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void copyText(recoveryCodes.join("\n"), "codes")}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#CAD0EB] px-3 py-2 text-xs font-bold text-[#08093B] dark:border-[#343B6B] dark:text-[#F3F5FF] cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copiedCodes ? "Copied!" : "Copy All"}</span>
              </button>
              <button
                type="button"
                onClick={downloadRecoveryCodes}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#CAD0EB] px-3 py-2 text-xs font-bold text-[#08093B] dark:border-[#343B6B] dark:text-[#F3F5FF] cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .txt</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                router.replace(targetPath as never);
                router.refresh();
              }}
              className="w-full rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-4 py-2.5 text-xs font-bold text-white shadow-sm cursor-pointer"
            >
              I&apos;ve Saved My Codes — Enter Company Panel
            </button>
          </div>
        )}

        {/* PHASE 2: ENROLL TOTP OR PASSKEY */}
        {phase === "enroll" && !recoveryCodes && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#FAF8FE] p-1 border border-[#DFE3F5] dark:bg-[#10142C] dark:border-[#272B4D]">
              <button
                type="button"
                onClick={() => setEnrollTab("totp")}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer transition ${
                  enrollTab === "totp"
                    ? "bg-[#663CF6] text-white shadow-xs"
                    : "text-[#4D5072] dark:text-[#B4BDD9]"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Authenticator 2FA</span>
              </button>
              <button
                type="button"
                onClick={() => setEnrollTab("passkey")}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer transition ${
                  enrollTab === "passkey"
                    ? "bg-[#663CF6] text-white shadow-xs"
                    : "text-[#4D5072] dark:text-[#B4BDD9]"
                }`}
              >
                <Fingerprint className="h-3.5 w-3.5" />
                <span>Device Passkey</span>
              </button>
            </div>

            {enrollTab === "totp" ? (
              <form onSubmit={handleConfirmTotp} className="space-y-3.5">
                <div className="rounded-[14px] border border-[#DFE3F5] bg-[#FAF8FE] p-4 space-y-2.5 dark:border-[#272B4D] dark:bg-[#10142C]">
                  <p className="text-xs font-bold text-[#08093B] dark:text-[#F3F5FF]">
                    Add to Google Authenticator, Microsoft Authenticator, or 1Password:
                  </p>
                  {loadingTotp ? (
                    <p className="text-xs text-[#76799C]">Generating encrypted setup key...</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2 rounded-xl border border-[#CAD0EB] bg-white px-3 py-2 dark:border-[#343B6B] dark:bg-[#141731]">
                        <code className="font-mono text-xs font-bold tracking-wider text-[#663CF6] dark:text-[#C4B5FD] break-all">
                          {totpSecret}
                        </code>
                        <button
                          type="button"
                          onClick={() => void copyText(totpSecret, "secret")}
                          className="shrink-0 rounded-lg bg-[#EDE7FF] px-2.5 py-1 text-[11px] font-bold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF] cursor-pointer"
                        >
                          {copiedSecret ? "Copied" : "Copy Key"}
                        </button>
                      </div>
                      {otpauthUri && (
                        <a
                          href={otpauthUri}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#663CF6] underline dark:text-[#A78BFA]"
                        >
                          <Smartphone className="h-3.5 w-3.5" />
                          <span>Open directly in Authenticator App</span>
                        </a>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="totp-confirm-code"
                    className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
                  >
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    id="totp-confirm-code"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    required
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full rounded-[12px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-2.5 text-center font-mono text-base font-extrabold tracking-[0.35em] text-[#08093B] focus:border-[#663CF6] focus:bg-white focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={confirmingTotp || !totpSecret}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-4 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {confirmingTotp && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Activate 2FA &amp; Generate Recovery Codes</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterPasskey} className="space-y-3.5">
                <p className="text-xs text-[#4D5072] dark:text-[#9DA6CC]">
                  Register Windows Hello, Touch ID, Face ID, or a hardware YubiKey so you can sign in and unlock the admin panel with biometrics.
                </p>
                <div>
                  <label
                    htmlFor="passkey-device-name"
                    className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
                  >
                    Device / Key Label
                  </label>
                  <input
                    id="passkey-device-name"
                    type="text"
                    required
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="e.g. Founder MacBook Touch ID"
                    className="w-full rounded-[12px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-2.5 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:bg-white focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  />
                </div>
                {!webAuthnReady && (
                  <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                    Passkeys require a modern HTTPS / localhost browser with WebAuthn support. Use Authenticator 2FA if unavailable.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={passkeyBusy || !webAuthnReady}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-4 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {passkeyBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Fingerprint className="h-4 w-4" />
                  )}
                  <span>{passkeyBusy ? "Waiting for Device..." : "Register Passkey & Unlock Panel"}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* PHASE 3: RETURNING MFA CHALLENGE */}
        {phase === "verify" && (
          <div className="space-y-4">
            {stateAdmin.passkeyCount > 0 && (
              <button
                type="button"
                disabled={passkeyBusy || !webAuthnReady}
                onClick={() => void handleVerifyPasskeyChallenge()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-[12px] border border-[#663CF6] bg-[#EDE7FF]/70 px-4 py-3 text-xs font-extrabold text-[#4F27E8] hover:bg-[#EDE7FF] disabled:opacity-60 cursor-pointer dark:border-[#7C3AED] dark:bg-[#251D4A] dark:text-[#E2D6FF]"
              >
                {passkeyBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Fingerprint className="h-4 w-4" />
                )}
                <span>Verify with Registered Passkey</span>
              </button>
            )}

            {stateAdmin.twoFactorEnabled && (
              <form onSubmit={handleVerifyTotpChallenge} className="space-y-3">
                <div>
                  <label
                    htmlFor="mfa-challenge-code"
                    className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
                  >
                    Authenticator 6-Digit Code or Recovery Code
                  </label>
                  <input
                    id="mfa-challenge-code"
                    type="text"
                    required
                    value={challengeCode}
                    onChange={(e) => setChallengeCode(e.target.value)}
                    placeholder="123456 or ABCD-EF12"
                    className="w-full rounded-[12px] border border-[#CAD0EB] bg-[#FAF8FE] px-3 py-2.5 text-center font-mono text-sm font-extrabold tracking-widest text-[#08093B] focus:border-[#663CF6] focus:bg-white focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifyingChallenge}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-4 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {verifyingChallenge && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Verify &amp; Unlock Company Panel</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
