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
 * Supports Indian SMS gateways (Fast2SMS, MSG91, 2Factor) and global (Twilio)
 * via standard environment variables:
 * - SMS_PROVIDER: 'fast2sms' | 'msg91' | 'twilio' | 'custom' | 'console'
 * - SMS_API_KEY
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

  // 1. Fast2SMS integration (India's premier high-speed SMS & OTP gateway)
  const fast2SmsApiKey =
    process.env.FAST2SMS_API_KEY ||
    process.env.SMS_API_KEY ||
    process.env.SMS_PROVIDER_API_KEY ||
    (provider === "fast2sms" ? apiKey : undefined);

  const isFast2SmsConfigured =
    Boolean(fast2SmsApiKey) &&
    !fast2SmsApiKey?.includes("your_fast2sms_api_key") &&
    !fast2SmsApiKey?.includes("replace_me") &&
    fast2SmsApiKey!.trim().length > 5;

  if (provider === "fast2sms") {
    if (!isFast2SmsConfigured) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[SmsService:Fast2SMS] SMS_PROVIDER is set to "fast2sms", but FAST2SMS_API_KEY is not configured or contains placeholder values. Configure FAST2SMS_API_KEY in .env.local to send live SMS to your mobile. Falling back to simulated OTP in development.`,
        );
        return { success: true, messageId: `sim_sms_${Date.now()}`, simulated: true };
      }
      console.error(
        `[SmsService:Fast2SMS] SMS_PROVIDER is set to "fast2sms", but FAST2SMS_API_KEY is missing or invalid in production.`,
      );
      throw new Error("Fast2SMS API key is not configured.");
    }

    try {
      // Fast2SMS operates strictly on 10-digit Indian mobile numbers without country code or leading zeros
      const cleanDigits = normalized.replace(/\D/g, "").slice(-10);
      if (cleanDigits.length !== 10) {
        throw new Error(
          `Fast2SMS requires a valid 10-digit Indian mobile number. Received: ${maskPhone(normalized)}`,
        );
      }

      const route = (process.env.FAST2SMS_ROUTE || "otp_api").toLowerCase();
      let response: Response;

      // Check for Fast2SMS Dedicated Send OTP API (https://docs.fast2sms.com/reference/send-otp)
      // When route is default or "otp_api" or "otp" or "smart_otp"
      if (route !== "dlt" && route !== "bulk" && route !== "q") {
        const otpId = (
          process.env.FAST2SMS_OTP_ID ||
          process.env.FAST2SMS_TEMPLATE_ID ||
          ""
        ).trim();

        const isOtpIdConfigured =
          Boolean(otpId) &&
          !otpId.includes("your_otp_id") &&
          !otpId.includes("replace_me") &&
          otpId.length >= 3;

        if (!isOtpIdConfigured) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              `[SmsService:Fast2SMS] FAST2SMS_OTP_ID is required for Fast2SMS Dedicated Send OTP API (https://docs.fast2sms.com/reference/send-otp). Create or view your Smart OTP Template in Fast2SMS Dashboard (Smart OTP -> OTP Template List) and copy your unique 10-character OTP ID into FAST2SMS_OTP_ID in .env.local. Falling back to simulated OTP in development.`,
            );
            return {
              success: true,
              messageId: `sim_sms_${Date.now()}`,
              simulated: true,
            };
          }
          console.error(
            `[SmsService:Fast2SMS] FAST2SMS_OTP_ID is missing in production for Fast2SMS Send OTP API.`,
          );
          throw new Error(
            "Fast2SMS Send OTP API requires FAST2SMS_OTP_ID. Please configure it in environment variables.",
          );
        }

        // Dedicated Fast2SMS Send OTP endpoint per official reference:
        // https://docs.fast2sms.com/reference/send-otp
        const payload: Record<string, any> = {
          otp_id: otpId,
          mobile: cleanDigits,
          otp: code,
          otp_expiry: expiresInMinutes,
          otp_length: 6,
        };

        if (process.env.FAST2SMS_VARIABLES_VALUES) {
          payload.variables_values = process.env.FAST2SMS_VARIABLES_VALUES;
        }

        response = await fetch("https://www.fast2sms.com/dev/otp/send", {
          method: "POST",
          headers: {
            authorization: fast2SmsApiKey!.trim(),
            accept: "application/json",
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else if (route === "dlt") {
        // Fast2SMS DLT Route: sender_id (DLT Header) + message (Template Message ID) + variables_values
        const senderId =
          process.env.FAST2SMS_SENDER_ID ||
          process.env.SMS_SENDER_ID ||
          "FSTSMS";
        const templateId =
          process.env.FAST2SMS_TEMPLATE_ID ||
          process.env.SMS_TEMPLATE_ID ||
          "";

        response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            authorization: fast2SmsApiKey!.trim(),
            accept: "application/json",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            route: "dlt",
            sender_id: senderId,
            message: templateId,
            variables_values: code,
            numbers: cleanDigits,
          }),
        });
      } else {
        // Fast2SMS Quick Route: full custom message text
        response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            authorization: fast2SmsApiKey!.trim(),
            accept: "application/json",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            route: "q",
            message: smsBody,
            language: "english",
            flash: 0,
            numbers: cleanDigits,
          }),
        });
      }

      const data = await response.json();
      if (!response.ok || data.return === false || (data.status_code && data.status_code !== 200)) {
        const errorMsg = Array.isArray(data.message)
          ? data.message.join(", ")
          : typeof data.message === "string"
            ? data.message
            : `Fast2SMS dispatch failed (HTTP ${response.status})`;
        throw new Error(errorMsg);
      }

      const messageId =
        data.request_id ||
        (Array.isArray(data.message) ? data.message[0] : `f2s_${Date.now()}`);
      console.info(
        `[SmsService:Fast2SMS] Delivered OTP via Send OTP API to ${maskPhone(normalized)} (ID: ${messageId})`,
      );
      return { success: true, messageId };
    } catch (error) {
      console.error(
        `[SmsService:Fast2SMS] Error dispatching to ${maskPhone(normalized)}:`,
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
    } catch (err: any) {
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

export interface VerifyFast2SmsOtpParams {
  phone: string;
  code: string;
}

export interface VerifyFast2SmsOtpResult {
  success: boolean;
  verified: boolean;
  message: string;
}

/**
 * Validates an OTP against Fast2SMS Verify OTP API:
 * Reference: https://docs.fast2sms.com/reference/verify-otp
 */
export async function verifyFast2SmsOtp(
  params: VerifyFast2SmsOtpParams,
): Promise<VerifyFast2SmsOtpResult> {
  const { phone, code } = params;
  const normalized = normalizePhone(phone);
  const cleanDigits = normalized.replace(/\D/g, "").slice(-10);
  const apiKey =
    process.env.FAST2SMS_API_KEY ||
    process.env.SMS_API_KEY ||
    process.env.SMS_PROVIDER_API_KEY;

  if (!apiKey || cleanDigits.length !== 10) {
    return {
      success: false,
      verified: false,
      message: "Valid API key and 10-digit Indian mobile number required",
    };
  }

  // Automated test environment fallback
  if (process.env.NODE_ENV === "test") {
    return {
      success: true,
      verified: true,
      message: "OTP verified successfully (test)",
    };
  }

  try {
    const response = await fetch("https://www.fast2sms.com/dev/otp/verify", {
      method: "POST",
      headers: {
        authorization: apiKey.trim(),
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        mobile: cleanDigits,
        otp: code.trim(),
      }),
    });

    const data = await response.json();
    const isVerified = Boolean(
      response.ok &&
        (data.return === true || (data.status_code && data.status_code === 200)),
    );
    const message = Array.isArray(data.message)
      ? data.message.join(", ")
      : typeof data.message === "string"
        ? data.message
        : isVerified
          ? "OTP verified successfully"
          : "OTP verification failed";

    return {
      success: true,
      verified: isVerified,
      message,
    };
  } catch (error: any) {
    console.error(`[SmsService:Fast2SMS] Verify OTP error:`, error);
    return {
      success: false,
      verified: false,
      message: error?.message || "Failed to verify OTP with Fast2SMS",
    };
  }
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
  } catch (error: any) {
    console.error(`[SmsService:MSG91] Verify OTP error:`, error);
    return {
      success: false,
      verified: false,
      message: error?.message || "Failed to verify OTP with MSG91",
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
  } catch (error: any) {
    console.error(`[SmsService:MSG91] Resend OTP error:`, error);
    return {
      success: false,
      message: error?.message || "Failed to resend OTP with MSG91",
    };
  }
}
