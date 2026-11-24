import "server-only";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { maskEmail } from "@/server/security/crypto";
import { renderOtpEmailHtml } from "./email-template";

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
 * Creates a configured Nodemailer transporter or returns null if not configured.
 */
function getTransporter() {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || "587", 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;

  if (!host || !user || !pass) {
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
  const fromAddress = process.env.EMAIL_FROM || "ScholoNix <onboarding@resend.dev>";
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

  // Resolve logo file for inline CID attachment
  const logoPath = path.join(process.cwd(), "public/images/scholonix-logo.png");
  const logoExists = fs.existsSync(logoPath);
  const logoBase64 = logoExists ? fs.readFileSync(logoPath).toString("base64") : null;

  // 1. Resend API support (if RESEND_API_KEY or EMAIL_PROVIDER_API_KEY is configured)
  const resendApiKey = process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER_API_KEY;
  if (resendApiKey) {
    providerAttempted = true;
    try {
      const resendBody: Record<string, any> = {
        from: fromAddress,
        to: [params.to],
        subject,
        html,
        text,
      };
      if (logoBase64) {
        resendBody.attachments = [
          {
            filename: "scholonix-logo.png",
            content: logoBase64,
            content_id: "scholonix-logo",
            contentId: "scholonix-logo",
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
      const data = await res.json();
      if (res.ok) {
        console.info(`[EmailService:Resend] Email delivered to ${maskEmail(params.to)}: id=${data.id}`);
        return { success: true, messageId: data.id };
      }
      const errMsg = data?.message || "Failed to send email via Resend";
      console.warn("[EmailService:Resend] Error response:", data);
      lastProviderError = errMsg;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to connect to Resend API";
      console.error("[EmailService:Resend] Failed to send via Resend:", err);
      lastProviderError = errMsg;
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
      const mailOptions: Record<string, any> = {
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

  // If a real provider was configured but failed to deliver, do not pretend success
  if (providerAttempted) {
    throw new Error(
      lastProviderError ||
        "Unable to deliver verification email. Please check your email configuration.",
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
