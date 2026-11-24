import "server-only";
import { maskPhone, normalizePhone } from "@/server/security/crypto";

export interface SendOtpSmsParams {
  phone: string;
  code: string;
  purpose: "REGISTRATION" | "LOGIN" | "PASSWORD_RESET";
  expiresInMinutes?: number;
}

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
}

/**
 * Pluggable SMS gateway adapter.
 * Supports Indian SMS gateways (Renflair, MSG91, 2Factor) and global (Twilio)
 * via standard environment variables:
 * - SMS_PROVIDER: 'renflair' | 'msg91' | 'twilio' | 'custom' | 'console'
 * - RENFLAIR_API_KEY / SMS_API_KEY
 * - SMS_SENDER_ID (DLT header for India, e.g. SCHLNX)
 * - SMS_TEMPLATE_ID (DLT template ID for Indian telecom regulations)
 */
export async function sendOtpSms(params: SendOtpSmsParams): Promise<SmsSendResult> {
  const { phone, code, purpose, expiresInMinutes = 5 } = params;
  const normalized = normalizePhone(phone);
  const provider = (process.env.SMS_PROVIDER || "console").toLowerCase();
  const apiKey = process.env.SMS_API_KEY || process.env.SMS_PROVIDER_API_KEY;

  const purposeTextMap = {
    REGISTRATION: "registration verification",
    LOGIN: "login",
    PASSWORD_RESET: "password reset",
  };
  const purposeText = purposeTextMap[purpose] || "verification";
  const smsBody = `${code} is your ScholoNix ${purposeText} OTP. Valid for ${expiresInMinutes} mins. Do not share this OTP with anyone.`;

  // In automated test environments (vitest/jest), skip external HTTP calls to avoid consuming provider quota
  if (process.env.NODE_ENV === "test") {
    return {
      success: true,
      messageId: `test_sms_${Date.now()}`,
      simulated: true,
    };
  }

  // 1. Renflair SMS integration (https://sms.renflair.in/V1.php)
  const renflairApiKey =
    process.env.RENFLAIR_API_KEY ||
    process.env.SMS_API_KEY ||
    process.env.SMS_PROVIDER_API_KEY ||
    (provider === "renflair" ? apiKey : undefined);

  const isRenflairConfigured =
    Boolean(renflairApiKey) &&
    !renflairApiKey?.includes("your_renflair_api_key") &&
    !renflairApiKey?.includes("replace_me") &&
    renflairApiKey!.trim().length > 5;

  if (provider === "renflair" || (!process.env.SMS_PROVIDER && isRenflairConfigured)) {
    if (!isRenflairConfigured) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[SmsService:Renflair] SMS_PROVIDER is set to "renflair", but RENFLAIR_API_KEY is not configured or contains placeholder values. Configure RENFLAIR_API_KEY in .env.local to send live SMS to your mobile. Falling back to simulated OTP in development.`,
        );
        return { success: true, messageId: `sim_sms_${Date.now()}`, simulated: true };
      }
      console.error(
        `[SmsService:Renflair] SMS_PROVIDER is set to "renflair", but RENFLAIR_API_KEY is missing or invalid in production.`,
      );
      throw new Error("Renflair API key is not configured.");
    }

    try {
      // Renflair operates strictly on 10-digit Indian mobile numbers without country code or leading zeros
      const cleanDigits = normalized.replace(/\D/g, "").slice(-10);
      if (cleanDigits.length !== 10) {
        throw new Error(
          `Renflair requires a valid 10-digit Indian mobile number. Received: ${maskPhone(normalized)}`,
        );
      }

      // Renflair SMS API Endpoint: https://sms.renflair.in/V1.php?API={API}&PHONE={PHONE}&OTP={OTP}
      const url = new URL("https://sms.renflair.in/V1.php");
      url.searchParams.set("API", renflairApiKey!.trim());
      url.searchParams.set("PHONE", cleanDigits);
      url.searchParams.set("OTP", code);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          accept: "application/json, text/plain, */*",
        },
      });

      const responseText = await response.text();
      let responseData: Record<string, unknown> | null = null;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        // Plain text response
      }

      if (responseData) {
        const statusVal = responseData.status ?? responseData.type ?? responseData.return;
        const isError =
          !response.ok ||
          statusVal === "error" ||
          statusVal === false ||
          (typeof responseData.status_code === "number" && responseData.status_code !== 200);

        if (isError) {
          const errorMsg =
            (typeof responseData.message === "string" && responseData.message) ||
            (typeof responseData.msg === "string" && responseData.msg) ||
            (typeof responseData.error === "string" && responseData.error) ||
            `Renflair dispatch failed (HTTP ${response.status})`;
          throw new Error(errorMsg);
        }
      } else {
        const lower = responseText.toLowerCase();
        if (!response.ok || lower.includes("error") || lower.includes("invalid api") || lower.includes("fail")) {
          throw new Error(responseText.trim() || `Renflair dispatch failed (HTTP ${response.status})`);
        }
      }

      const messageId =
        (responseData && (responseData.request_id || responseData.msg_id || responseData.id)) ||
        `renflair_${Date.now()}`;

      console.info(
        `[SmsService:Renflair] Delivered OTP via Renflair API to ${maskPhone(normalized)} (ID: ${messageId})`,
      );
      return { success: true, messageId: String(messageId) };
    } catch (error) {
      console.error(
        `[SmsService:Renflair] Error dispatching to ${maskPhone(normalized)}:`,
        error,
      );
      if (process.env.NODE_ENV !== "production") {
        return { success: true, messageId: `sim_sms_${Date.now()}`, simulated: true };
      }
      throw error;
    }
  }

  // 2. Twilio integration
  const twilioSid = process.env.TWILIO_ACCOUNT_SID || process.env.SMS_TWILIO_SID;
  const twilioToken =
    process.env.TWILIO_AUTH_TOKEN ||
    process.env.SMS_TWILIO_TOKEN ||
    (provider === "twilio" ? apiKey : undefined);
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER || process.env.SMS_SENDER_ID;

  const isTwilioConfigured =
    Boolean(twilioSid && twilioToken && twilioFrom) &&
    !twilioSid?.includes("your_account_sid") &&
    !twilioToken?.includes("your_auth_token") &&
    !twilioFrom?.includes("+1xxxxxxxxxx");

  if (provider === "twilio") {
    if (!isTwilioConfigured) {
      console.warn(
        `[SmsService:Twilio] SMS_PROVIDER is set to "twilio", but TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER contain placeholder values. Add your live Twilio credentials to .env.local to send SMS to your mobile. Falling back to simulated OTP in development.`,
      );
    } else {
      try {
        const basicAuth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
        const bodyParams = new URLSearchParams({
          To: normalized,
          From: twilioFrom!,
          Body: smsBody,
        });

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${basicAuth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: bodyParams.toString(),
          },
        );

        const data = await response.json();
        if (!response.ok || data.error_code) {
          throw new Error(data.message || `Twilio error: ${data.error_code}`);
        }

        console.info(`[SmsService:Twilio] Delivered OTP to ${maskPhone(normalized)}`);
        return { success: true, messageId: data.sid };
      } catch (error) {
        console.error(`[SmsService:Twilio] Error dispatching to ${maskPhone(normalized)}:`, error);
        if (process.env.NODE_ENV !== "production") {
          return { success: true, messageId: `sim_sms_${Date.now()}`, simulated: true };
        }
        throw error;
      }
    }
  }

  // 2. Generic HTTP Webhook / Custom SMS Gateway
  if (provider === "custom" && process.env.SMS_GATEWAY_URL && apiKey) {
    try {
      const response = await fetch(process.env.SMS_GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: normalized,
          message: smsBody,
          code,
          purpose,
        }),
      });

      if (!response.ok) {
        throw new Error(`Custom SMS gateway responded with ${response.status}`);
      }

      return { success: true, messageId: `gw_${Date.now()}` };
    } catch (error) {
      console.error(`[SmsService:Custom] Error dispatching to ${maskPhone(normalized)}:`, error);
      if (process.env.NODE_ENV !== "production") {
        return { success: true, messageId: `sim_sms_${Date.now()}`, simulated: true };
      }
      throw error;
    }
  }

  // 3. 2Factor.in integration (India)
  if ((provider === "2factor" || provider === "twofactor") && apiKey) {
    try {
      const cleanDigits = normalized.replace(/\D/g, "").slice(-10);
      const url = `https://2factor.in/API/V1/${apiKey}/SMS/${cleanDigits}/${code}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.Status === "Success") {
        console.info(`[SmsService:2Factor] Delivered OTP to ${maskPhone(normalized)}`);
        return { success: true, messageId: data.Details };
      }
      console.warn("[SmsService:2Factor] 2Factor response:", data);
    } catch (err) {
      console.error("[SmsService:2Factor] Error dispatching to 2Factor:", err);
    }
  }

  // 4. MSG91 SendOTP API integration (India & Global)
  // Reference: https://docs.msg91.com/otp/sendotp.openapi.yml
  const msg91AuthKey =
    process.env.MSG91_AUTH_KEY ||
    (provider === "msg91" ? apiKey : undefined);
  const msg91TemplateId =
    process.env.MSG91_OTP_TEMPLATE_ID ||
    process.env.MSG91_TEMPLATE_ID ||
    process.env.SMS_TEMPLATE_ID;

  const isMsg91Configured =
    Boolean(msg91AuthKey) &&
    !msg91AuthKey?.includes("your_msg91_auth_key") &&
    !msg91AuthKey?.includes("replace_me") &&
    msg91AuthKey!.trim().length > 5;

  if (provider === "msg91") {
    if (!isMsg91Configured) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[SmsService:MSG91] SMS_PROVIDER is set to "msg91", but MSG91_AUTH_KEY is not configured or contains placeholder values. Configure MSG91_AUTH_KEY in .env.local to send live SMS to your mobile. Falling back to simulated OTP in development.`,
        );
        return { success: true, messageId: `sim_sms_${Date.now()}`, simulated: true };
      }
      console.error(
        `[SmsService:MSG91] SMS_PROVIDER is set to "msg91", but MSG91_AUTH_KEY is missing or invalid in production.`,
      );
      throw new Error("MSG91 authkey is not configured.");
    }

    try {
      const cleanPhone = normalized.replace(/\D/g, "");
      const url = new URL("https://control.msg91.com/api/v5/otp");
      url.searchParams.set("mobile", cleanPhone);
      url.searchParams.set("otp", code);
      url.searchParams.set("otp_expiry", String(expiresInMinutes));
      url.searchParams.set("otp_length", "6");
      if (msg91TemplateId) {
        url.searchParams.set("template_id", msg91TemplateId);
      }

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          authkey: msg91AuthKey!.trim(),
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          Param1: "ScholoNix",
          Param2: purposeText,
          Param3: code,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.type === "error") {
        throw new Error(data.message || `MSG91 SendOTP failed with status ${res.status}`);
      }

      const messageId = data.request_id || data.message || `msg91_${Date.now()}`;
      console.info(
        `[SmsService:MSG91] Delivered OTP via SendOTP API to ${maskPhone(normalized)} (ID: ${messageId})`,
      );
      return { success: true, messageId };
    } catch (err: unknown) {
      console.error(`[SmsService:MSG91] Error dispatching to ${maskPhone(normalized)}:`, err);
      if (process.env.NODE_ENV !== "production") {
        return { success: true, messageId: `sim_sms_${Date.now()}`, simulated: true };
      }
      throw err;
    }
  }

  // 5. Fallback / Dev / Console provider
  console.info(
    `[SmsService:Simulated] SMS to ${maskPhone(normalized)}: OTP=${code} (${smsBody})`,
  );
  return {
    success: true,
    messageId: `sim_sms_${Date.now()}`,
    simulated: true,
  };
}

export interface VerifyMsg91OtpParams {
  phone: string;
  code: string;
}

export interface VerifyMsg91OtpResult {
  success: boolean;
  verified: boolean;
  message: string;
}

/**
 * Validates an OTP against MSG91 Verify OTP API:
 * Reference: https://docs.msg91.com/otp/verify-otp.openapi.yml
 */
export async function verifyMsg91Otp(
  params: VerifyMsg91OtpParams,
): Promise<VerifyMsg91OtpResult> {
  const { phone, code } = params;
  const normalized = normalizePhone(phone);
  const cleanPhone = normalized.replace(/\D/g, "");
  const authkey =
    process.env.MSG91_AUTH_KEY ||
    process.env.SMS_API_KEY ||
    process.env.SMS_PROVIDER_API_KEY;

  if (!authkey || !cleanPhone) {
    return {
      success: false,
      verified: false,
      message: "Valid MSG91 authkey and mobile number required",
    };
  }

  // Automated test environment fallback
  if (process.env.NODE_ENV === "test") {
    return {
      success: true,
      verified: true,
      message: "OTP verified success (test)",
    };
  }

  try {
    const url = new URL("https://control.msg91.com/api/v5/otp/verify");
    url.searchParams.set("mobile", cleanPhone);
    url.searchParams.set("otp", code.trim());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        authkey: authkey.trim(),
        accept: "application/json",
      },
    });

    const data = await response.json();
    const isVerified = Boolean(response.ok && data.type === "success");

    return {
      success: true,
      verified: isVerified,
      message: data.message || (isVerified ? "OTP verified success" : "OTP verification failed"),
    };
  } catch (error: unknown) {
    console.error(`[SmsService:MSG91] Verify OTP error:`, error);
    const errMsg = error instanceof Error ? error.message : "Failed to verify OTP with MSG91";
    return {
      success: false,
      verified: false,
      message: errMsg,
    };
  }
}

export interface ResendMsg91OtpParams {
  phone: string;
  retryType?: "text" | "voice";
}

/**
 * Resends the active OTP to the mobile number via MSG91 Resend OTP API:
 * Reference: https://docs.msg91.com/otp/resend-otp.openapi.yml
 */
export async function resendMsg91Otp(
  params: ResendMsg91OtpParams,
): Promise<{ success: boolean; message: string }> {
  const { phone, retryType = "text" } = params;
  const normalized = normalizePhone(phone);
  const cleanPhone = normalized.replace(/\D/g, "");
  const authkey =
    process.env.MSG91_AUTH_KEY ||
    process.env.SMS_API_KEY ||
    process.env.SMS_PROVIDER_API_KEY;

  if (!authkey || !cleanPhone) {
    return {
      success: false,
      message: "Valid MSG91 authkey and mobile number required",
    };
  }

  try {
    const url = new URL("https://control.msg91.com/api/v5/otp/retry");
    url.searchParams.set("mobile", cleanPhone);
    url.searchParams.set("retrytype", retryType);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        authkey: authkey.trim(),
        accept: "application/json",
      },
    });

    const data = await response.json();
    const isSuccess = Boolean(response.ok && data.type === "success");

    return {
      success: isSuccess,
      message: data.message || (isSuccess ? "OTP resent successfully" : "Failed to resend OTP"),
    };
  } catch (error: unknown) {
    console.error(`[SmsService:MSG91] Resend OTP error:`, error);
    const errMsg = error instanceof Error ? error.message : "Failed to resend OTP with MSG91";
    return {
      success: false,
      message: errMsg,
    };
  }
}
