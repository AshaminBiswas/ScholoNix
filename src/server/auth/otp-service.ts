import "server-only";
import {
  generateSecureOtp,
  hashOtp,
  verifyOtpHash,
  generateSecureToken,
  maskEmail,
  maskPhone,
  normalizePhone,
} from "@/server/security/crypto";
import { authRepository, OtpRecord } from "./auth-repository";
import { sendOtpEmail } from "@/server/notifications/email-service";
import { sendOtpSms } from "@/server/notifications/sms-service";
import { logAuditEvent } from "@/server/security/audit-logger";

export type OtpChannel = "EMAIL" | "SMS";
export type OtpPurpose = "REGISTRATION" | "LOGIN" | "PASSWORD_RESET";

export interface RequestOtpParams {
  identifier: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
  recipientName?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RequestOtpResult {
  success: boolean;
  message: string;
  channel: OtpChannel;
  destinationMasked: string;
  cooldownSeconds: number;
  expiresInMinutes: number;
}

export interface VerifyOtpParams {
  identifier: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
  code: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  verified: boolean;
  verificationToken?: string;
  message: string;
  remainingAttempts?: number;
}

const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

/**
 * Normalizes identifier based on channel.
 */
function normalizeIdentifier(raw: string, channel: OtpChannel): string {
  if (channel === "EMAIL") {
    return raw.trim().toLowerCase();
  }
  return normalizePhone(raw);
}

/**
 * Masks destination for safe return in API response.
 */
function maskDestination(identifier: string, channel: OtpChannel): string {
  return channel === "EMAIL" ? maskEmail(identifier) : maskPhone(identifier);
}

let otpGenerator = generateSecureOtp;

/**
 * Hook for test environments to inject deterministic OTP generator.
 */
export function setOtpGeneratorForTesting(generator?: () => string) {
  otpGenerator = generator || generateSecureOtp;
}

export const otpService = {
  /**
   * Generates and dispatches a cryptographically secure 6-digit OTP.
   * Enforces 60-second cooldown and 5-minute expiry.
   */
  async requestOtp(params: RequestOtpParams): Promise<RequestOtpResult> {
    const { channel, purpose, recipientName, ipAddress, userAgent } = params;
    const identifier = normalizeIdentifier(params.identifier, channel);
    const now = new Date();

    // 1. Check if an active OTP already exists and enforce resend cooldown
    const activeOtp = await authRepository.findActiveOtp(identifier, channel, purpose);
    if (activeOtp) {
      const resendAllowedAt = new Date(activeOtp.resendAfter).getTime();
      const diffMs = resendAllowedAt - now.getTime();
      if (diffMs > 0) {
        const remainingSeconds = Math.ceil(diffMs / 1000);
        throw new Error(
          `Please wait ${remainingSeconds} seconds before requesting a new verification code.`,
        );
      }

      // Invalidate existing active OTP so only one valid code exists at a time
      await authRepository.invalidatePreviousOtps(identifier, channel, purpose);
    }

    // 2. Generate secure 6-digit code and HMAC-SHA256 hash
    const code = otpGenerator();
    const codeHash = hashOtp(code);

    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const resendAfter = new Date(now.getTime() + RESEND_COOLDOWN_SECONDS * 1000);

    // 3. Persist OTP record with hash ONLY
    await authRepository.saveOtp({
      identifier,
      channel,
      purpose,
      codeHash,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      expiresAt,
      resendAfter,
      verifiedAt: null,
    });

    // 4. Dispatch via channel adapter
    try {
      if (channel === "EMAIL") {
        await sendOtpEmail({
          to: identifier,
          code,
          purpose,
          recipientName,
          expiresInMinutes: OTP_EXPIRY_MINUTES,
        });
      } else {
        await sendOtpSms({
          phone: identifier,
          code,
          purpose,
          expiresInMinutes: OTP_EXPIRY_MINUTES,
        });
      }
    } catch (dispatchError: unknown) {
      // Invalidate the un-dispatched OTP so user is not blocked by cooldown
      try {
        await authRepository.invalidatePreviousOtps(identifier, channel, purpose);
      } catch {}
      throw dispatchError;
    }

    // 5. Audit log
    await logAuditEvent({
      action: "OTP_REQUESTED",
      entityType: "OtpVerification",
      details: {
        channel,
        purpose,
        destination: maskDestination(identifier, channel),
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: `Verification code sent to ${maskDestination(identifier, channel)}`,
      channel,
      destinationMasked: maskDestination(identifier, channel),
      cooldownSeconds: RESEND_COOLDOWN_SECONDS,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    };
  },

  /**
   * Verifies an OTP code using timing-safe comparison, tracking attempts and invalidating on lockout.
   */
  async verifyOtp(params: VerifyOtpParams): Promise<VerifyOtpResult> {
    const { channel, purpose, code, ipAddress, userAgent } = params;
    const identifier = normalizeIdentifier(params.identifier, channel);
    const trimmedCode = code.trim();

    if (!trimmedCode || trimmedCode.length !== 6) {
      return {
        success: false,
        verified: false,
        message: "Please enter the complete 6-digit verification code.",
      };
    }

    // 1. Find active unexpired OTP
    const otp = await authRepository.findActiveOtp(identifier, channel, purpose);
    if (!otp) {
      return {
        success: false,
        verified: false,
        message: "Invalid or expired verification code. Please request a new one.",
      };
    }

    // 2. Check if attempts already exceeded max
    if (otp.attempts >= otp.maxAttempts) {
      await authRepository.invalidatePreviousOtps(identifier, channel, purpose);
      await logAuditEvent({
        action: "OTP_LOCKOUT",
        entityType: "OtpVerification",
        entityId: otp.id,
        details: { channel, purpose, identifier: maskDestination(identifier, channel) },
        ipAddress,
        userAgent,
      });
      return {
        success: false,
        verified: false,
        message: "Too many failed attempts. This code is locked. Please request a new verification code.",
        remainingAttempts: 0,
      };
    }

    // 3. Constant-time hash verification
    const isMatch = verifyOtpHash(trimmedCode, otp.codeHash);

    if (!isMatch) {
      const currentAttempts = await authRepository.incrementOtpAttempts(otp.id);
      const remaining = Math.max(0, otp.maxAttempts - currentAttempts);

      if (remaining === 0) {
        await authRepository.invalidatePreviousOtps(identifier, channel, purpose);
      }

      await logAuditEvent({
        action: "OTP_FAILED_ATTEMPT",
        entityType: "OtpVerification",
        entityId: otp.id,
        details: { channel, purpose, attempts: currentAttempts, remainingAttempts: remaining },
        ipAddress,
        userAgent,
      });

      return {
        success: false,
        verified: false,
        message:
          remaining > 0
            ? `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
            : "Too many failed attempts. Code has been locked. Please request a new one.",
        remainingAttempts: remaining,
      };
    }

    // 4. Verification succeeded: generate proof token & mark verified
    const verificationToken = generateSecureToken(32);
    await authRepository.markOtpVerified(otp.id, verificationToken);

    await logAuditEvent({
      action: "OTP_VERIFIED",
      entityType: "OtpVerification",
      entityId: otp.id,
      details: { channel, purpose, identifier: maskDestination(identifier, channel) },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      verified: true,
      verificationToken,
      message: `${channel === "EMAIL" ? "Email" : "Mobile number"} verified successfully!`,
    };
  },

  /**
   * Validates a verification token previously issued upon successful OTP verification.
   */
  async validateVerificationToken(
    token: string,
    expectedChannel: OtpChannel,
    expectedPurpose: OtpPurpose,
  ): Promise<{ valid: boolean; identifier?: string }> {
    if (!token) return { valid: false };

    const record = await authRepository.findOtpByToken(token);
    if (
      !record ||
      !record.verifiedAt ||
      record.channel !== expectedChannel ||
      record.purpose !== expectedPurpose
    ) {
      return { valid: false };
    }

    return { valid: true, identifier: record.identifier };
  },
};
