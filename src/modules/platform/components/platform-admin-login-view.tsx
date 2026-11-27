"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Fingerprint, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  authenticatePlatformPasskeyClient,
  isWebAuthnSupported,
} from "@/modules/platform/lib/webauthn-client";

export function PlatformAdminLoginView({ targetPath }: { targetPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [webAuthnReady, setWebAuthnReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWebAuthnReady(isWebAuthnSupported());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/platform/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "Invalid credentials.");
      }
      router.replace((json.redirectTo || targetPath) as never);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasskeySignIn = async () => {
    setError(null);
    setPasskeyBusy(true);
    try {
      const json = await authenticatePlatformPasskeyClient(email);
      router.replace((json.redirectTo || targetPath) as never);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Passkey sign-in failed.");
    } finally {
      setPasskeyBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F4F6FC] flex items-center justify-center p-4 dark:bg-[#090B1A]">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md rounded-[24px] border border-[#D6DBF0] bg-white p-6 sm:p-8 shadow-xl dark:border-[#272B4D] dark:bg-[#141731] space-y-5">
        <div className="flex flex-col items-center text-center">
          <BrandLogo className="h-9" asLink={false} />
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#EDE7FF] px-3 py-1 text-[11px] font-extrabold text-[#663CF6] dark:bg-[#251D4A] dark:text-[#CBB8FF]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Company Administration Portal</span>
          </span>
          <h1 className="mt-3 text-xl font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
            Company Admin Sign In
          </h1>
          <p className="mt-1 text-xs text-[#4D5072] dark:text-[#9DA6CC]">
            Authorized ScholoNix company management accounts only (`platform_admins`).
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-[12px] border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="platform-admin-email"
              className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
            >
              Company Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#76799C]" />
              <input
                id="platform-admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@company.com"
                className="w-full rounded-[12px] border border-[#CAD0EB] bg-[#FAF8FE] pl-10 pr-3 py-2.5 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:bg-white focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="platform-admin-password"
              className="block text-xs font-bold text-[#08093B] mb-1 dark:text-[#F3F5FF]"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#76799C]" />
              <input
                id="platform-admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-[12px] border border-[#CAD0EB] bg-[#FAF8FE] pl-10 pr-3 py-2.5 text-xs font-semibold text-[#08093B] focus:border-[#663CF6] focus:bg-white focus:outline-none dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || passkeyBusy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-60 cursor-pointer"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{submitting ? "Signing In..." : "Sign In to Company Panel"}</span>
          </button>

          {webAuthnReady && (
            <>
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-[#E6E9F6] dark:border-[#272B4D]" />
                <span className="mx-3 text-[10px] font-bold uppercase tracking-wider text-[#76799C] dark:text-[#9DA6CC]">
                  or passkey
                </span>
                <div className="flex-grow border-t border-[#E6E9F6] dark:border-[#272B4D]" />
              </div>
              <button
                type="button"
                disabled={submitting || passkeyBusy}
                onClick={() => void handlePasskeySignIn()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-[12px] border border-[#CAD0EB] bg-[#FAF8FE] px-4 py-2.5 text-xs font-bold text-[#08093B] hover:border-[#663CF6] hover:bg-[#EDE7FF]/50 disabled:opacity-60 cursor-pointer dark:border-[#343B6B] dark:bg-[#10142C] dark:text-[#F3F5FF] dark:hover:border-[#8B5CF6]"
              >
                {passkeyBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Fingerprint className="h-4 w-4 text-[#663CF6] dark:text-[#C4B5FD]" />
                )}
                <span>{passkeyBusy ? "Checking Passkey..." : "Sign in with Passkey"}</span>
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
