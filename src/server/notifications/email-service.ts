import "server-only";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { maskEmail } from "@/server/security/crypto";
import { AppError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { renderOtpEmailHtml } from "./email-template";

function stripSurroundingQuotes(val?: string): string {
  if (!val) return "";
  return val.trim().replace(/^["']+|["']+$/g, "").trim();
}

function extractEmailOnly(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return (match?.[1] ?? raw).trim();
}

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SendOtpEmailParams {
  to: string;
  code: string;
  purpose: "REGISTRATION" | "LOGIN" | "PASSWORD_RESET";
  recipientName?: string;
  expiresInMinutes?: number;
}

/**
 * Validates whether an email address format is strictly valid before dispatching.
 */
export function isValidEmailAddress(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  // Standard RFC 5322 compatible email regex
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return regex.test(trimmed) && trimmed.length <= 254;
}

/**
 * Resolves the configured sender address using verified custom domain credentials.
 * Prioritizes RESEND_FROM_NAME and RESEND_FROM_EMAIL.
 * Always targets the verified domain scholonix.com, never testing sandbox onboarding@resend.dev.
 */
export function getSenderAddress(): string {
  const fromName =
    stripSurroundingQuotes(process.env.RESEND_FROM_NAME || process.env.EMAIL_FROM_NAME) ||
    "ScholoNix";
  const rawFromEmail = stripSurroundingQuotes(
    process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM_ADDRESS,
  );
  const parsedFromEmail = rawFromEmail ? extractEmailOnly(rawFromEmail) : "";

  if (parsedFromEmail && !parsedFromEmail.includes("onboarding@resend.dev")) {
    return `${fromName} <${parsedFromEmail}>`;
  }

  const rawEnvEmailFrom = stripSurroundingQuotes(process.env.EMAIL_FROM);
  if (rawEnvEmailFrom && !rawEnvEmailFrom.includes("onboarding@resend.dev")) {
    const parsedEmail = extractEmailOnly(rawEnvEmailFrom);
    if (rawEnvEmailFrom.includes("<") && isValidEmailAddress(parsedEmail)) {
      return rawEnvEmailFrom;
    }
    if (isValidEmailAddress(parsedEmail)) {
      return `${fromName} <${parsedEmail}>`;
    }
  }

  // Verified ScholoNix production domain
  return `${fromName} <noreply@scholonix.com>`;
}

/**
 * Creates a configured Nodemailer transporter or returns null if not configured.
 */
function getTransporter() {
  const host = stripSurroundingQuotes(process.env.SMTP_HOST || process.env.EMAIL_HOST);
  const port = parseInt(
    stripSurroundingQuotes(process.env.SMTP_PORT || process.env.EMAIL_PORT) || "587",
    10,
  );
  const user = stripSurroundingQuotes(process.env.SMTP_USER || process.env.EMAIL_USER);
  const pass = stripSurroundingQuotes(process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD);

  if (!host || !user || !pass || host.includes("example.com")) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Sends an email containing the OTP code with HTML and plaintext options.
 */
export async function sendOtpEmail(params: SendOtpEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  simulated?: boolean;
}> {
  if (!isValidEmailAddress(params.to)) {
    throw new ValidationError(
      `Invalid recipient email address: "${params.to}". Please provide a valid email.`,
    );
  }

  const fromAddress = getSenderAddress();
  const transporter = getTransporter();

  const subjectMap = {
    REGISTRATION: "ScholoNix — Verify Your Email Address",
    LOGIN: "ScholoNix — Your Login Verification Code",
    PASSWORD_RESET: "ScholoNix — Password Reset Verification Code",
  };

  const subject = subjectMap[params.purpose] || "ScholoNix Verification Code";
  const html = renderOtpEmailHtml(params);
  const text = `Hello,

Your ScholoNix verification code is: ${params.code}

This code will expire in ${params.expiresInMinutes || 5} minutes.
Never share this code with anyone.

If you did not request this, please ignore this email.

— Team ScholoNix`;

  // In automated test environments (vitest/jest), skip external HTTP calls to avoid hitting rate limits or restrictions on fake domains
  if (process.env.NODE_ENV === "test") {
    return {
      success: true,
      messageId: `test_${Date.now()}`,
      simulated: true,
    };
  }

  let providerAttempted = false;
  let lastProviderError: string | null = null;

  // Resolve logo file for inline CID attachment safely
  const logoPath = path.join(process.cwd(), "public/images/scholonix-logo.png");
  let logoExists = false;
  let logoBase64: string | null = null;
  try {
    logoExists = fs.existsSync(logoPath);
    logoBase64 = logoExists ? fs.readFileSync(logoPath).toString("base64") : null;
  } catch {
    logoExists = false;
    logoBase64 = null;
  }

  // 1. Resend API support (prioritized for verified domain delivery)
  const resendApiKey = stripSurroundingQuotes(
    process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER_API_KEY,
  );
  if (resendApiKey) {
    providerAttempted = true;
    try {
      const resendBody: Record<string, unknown> = {
        from: fromAddress,
        to: [params.to.trim().toLowerCase()],
        subject,
        html,
        text,
        headers: {
          "X-Entity-Ref-ID": `otp-${Date.now()}`,
          "X-Auto-Response-Suppress": "OOF, AutoReply",
        },
        tags: [
          { name: "category", value: "transactional" },
          { name: "purpose", value: params.purpose.toLowerCase() },
        ],
      };
      if (logoBase64 && html.includes("cid:scholonix-logo")) {
        resendBody.attachments = [
          {
            filename: "scholonix-logo.png",
            content: logoBase64,
            content_id: "scholonix-logo",
          },
        ];
      }
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resendBody),
      });
      const rawText = await res.text();
      interface ResendApiResponse {
        id?: string;
        name?: string;
        message?: string;
        error?: { message?: string };
      }
      let data: ResendApiResponse | null = null;
      try {
        data = rawText ? (JSON.parse(rawText) as ResendApiResponse) : null;
      } catch {
        data = null;
      }
      if (res.ok && data?.id) {
        logger.info(
          { event: "EMAIL_OTP_SENT", provider: "resend", messageId: data.id, from: fromAddress, to: maskEmail(params.to) },
          `[EmailService:Resend] Email delivered to ${maskEmail(params.to)}`,
        );
        return { success: true, messageId: data.id };
      }
      const errMsg =
        data?.message ||
        data?.error?.message ||
        (rawText ? rawText.slice(0, 200) : null) ||
        `Resend API rejected request (HTTP ${res.status})`;
      logger.warn(
        {
          event: "EMAIL_OTP_REJECTED",
          provider: "resend",
          status: res.status,
          from: fromAddress,
          to: maskEmail(params.to),
          errorName: data?.name,
          errorMessage: errMsg,
        },
        `[EmailService:Resend] Delivery rejected for ${maskEmail(params.to)}: HTTP ${res.status}`,
      );
      lastProviderError = `Resend error (HTTP ${res.status}): ${errMsg}`;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to connect to Resend API";
      logger.error(
        { event: "EMAIL_OTP_ERROR", provider: "resend", to: maskEmail(params.to), error: errMsg },
        `[EmailService:Resend] Connection error while dispatching to ${maskEmail(params.to)}`,
      );
      lastProviderError = `Resend connection failed: ${errMsg}`;
    }
  }

  // 2. Brevo (Sendinblue) API support (if BREVO_API_KEY is configured)
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey) {
    providerAttempted = true;
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: "ScholoNix", email: fromAddress.includes("<") ? fromAddress.match(/<([^>]+)>/)?.[1] : fromAddress },
          to: [{ email: params.to, name: params.recipientName || "Administrator" }],
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        console.info(`[EmailService:Brevo] Email delivered to ${maskEmail(params.to)}: messageId=${data.messageId}`);
        return { success: true, messageId: data.messageId };
      }
      const errMsg = data?.message || "Failed to send email via Brevo";
      console.warn("[EmailService:Brevo] Error response:", data);
      lastProviderError = errMsg;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to connect to Brevo API";
      console.error("[EmailService:Brevo] Failed to send via Brevo:", err);
      lastProviderError = errMsg;
    }
  }

  // 3. SMTP Transporter (Gmail, Custom SMTP)
  if (transporter) {
    providerAttempted = true;
    try {
      const mailOptions: Record<string, unknown> = {
        from: fromAddress,
        to: params.to,
        subject,
        text,
        html,
      };
      if (logoExists) {
        mailOptions.attachments = [
          {
            filename: "scholonix-logo.png",
            path: logoPath,
            cid: "scholonix-logo",
          },
        ];
      }
      const info = await transporter.sendMail(mailOptions);

      console.info(
        `[EmailService:Sent] Email delivered to ${maskEmail(params.to)}: messageId=${info.messageId}`,
      );
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Failed to deliver email via SMTP";
      console.error(`[EmailService:Error] Failed to send email to ${maskEmail(params.to)}:`, error);
      lastProviderError = errMsg;
    }
  }

  // If a real provider was configured but failed to deliver, surface a structured 502 error (not unhandled 500)
  if (providerAttempted) {
    throw new AppError(
      lastProviderError ||
        "Unable to deliver verification email. Please check your email configuration.",
      502,
      "EMAIL_DELIVERY_FAILED",
    );
  }

  // 4. Simulated development fallback ONLY when NO real providers are configured
  console.info(
    `[EmailService:Simulated] Email to ${maskEmail(params.to)}: OTP=${params.code} for ${params.purpose}`,
  );
  return {
    success: true,
    messageId: `sim_${Date.now()}`,
    simulated: true,
  };
}

export async function sendTransactionalEmail(params: {
  to: string;
  cc?: string | null;
  bcc?: string | null;
  subject: string;
  text: string;
  html?: string;
}): Promise<{
  success: boolean;
  messageId?: string;
  simulated?: boolean;
}> {
  if (!isValidEmailAddress(params.to)) {
    throw new ValidationError(
      `Invalid recipient email address: "${params.to}". Please provide a valid email.`,
    );
  }

  if (process.env.NODE_ENV === "test") {
    return {
      success: true,
      messageId: `test_comm_${Date.now()}`,
      simulated: true,
    };
  }

  const fromAddress = getSenderAddress();
  const transporter = getTransporter();
  const html =
    params.html ||
    `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">${params.text
      .split("\n")
      .map((line) => `<p style="margin:0 0 8px">${line.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
      .join("")}</div>`;

  const resendApiKey = stripSurroundingQuotes(
    process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER_API_KEY,
  );
  if (resendApiKey) {
    try {
      const body: Record<string, unknown> = {
        from: fromAddress,
        to: [params.to.trim().toLowerCase()],
        subject: params.subject,
        html,
        text: params.text,
      };
      if (params.cc && isValidEmailAddress(params.cc)) body.cc = [params.cc.trim().toLowerCase()];
      if (params.bcc && isValidEmailAddress(params.bcc)) body.bcc = [params.bcc.trim().toLowerCase()];
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { id?: string };
        return { success: true, messageId: data.id || `resend_${Date.now()}` };
      }
    } catch {
      // Fall through cleanly if network/provider fails in dev
    }
  }

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: params.to.trim().toLowerCase(),
        cc: params.cc && isValidEmailAddress(params.cc) ? params.cc.trim() : undefined,
        bcc: params.bcc && isValidEmailAddress(params.bcc) ? params.bcc.trim() : undefined,
        subject: params.subject,
        text: params.text,
        html,
      });
      return { success: true, messageId: info.messageId };
    } catch {
      // Fall through to simulated flag when SMTP fails in local dev
    }
  }

  logger.info(
    { event: "ADMISSIONS_EMAIL_SIMULATED", to: maskEmail(params.to), subject: params.subject },
    `[EmailService:Simulated] Admissions communication to ${maskEmail(params.to)}`,
  );
  return {
    success: true,
    messageId: `sim_${Date.now()}`,
    simulated: true,
  };
}
