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
import { authRepository } from "./auth-repository";
import { sendOtpEmail } from "@/server/notifications/email-service";
import { sendOtpSms } from "@/server/notifications/sms-service";
import { logAuditEvent } from "@/server/security/audit-logger";
import { logger } from "@/lib/logger";

export type OtpChannel = "EMAIL" | "SMS";
export type OtpPurpose = "REGISTRATION" | "LOGIN" | "PASSWORD_RESET";

export type OtpVerifyErrorCode =
  | "INVALID_OTP_FORMAT"
  | "OTP_NOT_FOUND"
  | "OTP_EXPIRED"
  | "OTP_ALREADY_USED"
  | "OTP_LOCKED"
  | "OTP_INVALID"
  | "OTP_CONSUME_CONFLICT";

export interface RequestOtpParams {
  identifier: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
  recipientName?: string;
  registrationSessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RequestOtpResult {
  success: boolean;
  message: string;
  channel: OtpChannel;
  type: "email" | "mobile";
  challengeId: string;
  destinationMasked: string;
  cooldownSeconds: number;
  expiresInMinutes: number;
}

export interface VerifyOtpParams {
  identifier: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
  code: string;
  registrationSessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  verified: boolean;
  type: "email" | "mobile";
  challengeId?: string;
  verificationToken?: string;
  message: string;
  errorCode?: OtpVerifyErrorCode;
  remainingAttempts?: number;
}

const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

/**
 * In-flight request locks keyed by (purpose, channel, identifier) to prevent duplicate OTP creation
 * on concurrent double clicks within the same worker instance.
 */
const inFlightOtpRequests = new Map<string, Promise<RequestOtpResult>>();

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
 * Masks destination for safe return in API response and logs.
 */
function maskDestination(identifier: string, channel: OtpChannel): string {
  return channel === "EMAIL" ? maskEmail(identifier) : maskPhone(identifier);
}

function channelToType(channel: OtpChannel): "email" | "mobile" {
  return channel === "EMAIL" ? "email" : "mobile";
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
   * Enforces 60-second cooldown and 5-minute UTC expiry.
   */
  async requestOtp(params: RequestOtpParams): Promise<RequestOtpResult> {
    const { channel, purpose, recipientName, registrationSessionId, ipAddress, userAgent } = params;
    const identifier = normalizeIdentifier(params.identifier, channel);
    const lockKey = `${purpose}:${channel}:${identifier}:${registrationSessionId || "default"}`;

    const existingPromise = inFlightOtpRequests.get(lockKey);
    if (existingPromise) {
      return existingPromise;
    }

    const executeRequest = async (): Promise<RequestOtpResult> => {
      const now = new Date();
      const verificationType = channelToType(channel);
      const masked = maskDestination(identifier, channel);

      // 1. Check if an active OTP already exists and enforce resend cooldown
      const activeOtp = await authRepository.findActiveOtp(
        identifier,
        channel,
        purpose,
        registrationSessionId,
      );
      if (activeOtp) {
        const resendAllowedAt = new Date(activeOtp.resendAfter).getTime();
        const diffMs = resendAllowedAt - now.getTime();
        if (diffMs > 0) {
          const remainingSeconds = Math.ceil(diffMs / 1000);
          throw new Error(
            `Please wait ${remainingSeconds} seconds before requesting a new verification code.`,
          );
        }

        // Invalidate existing unverified OTPs so only the latest code is active
        await authRepository.invalidatePreviousOtps(
          identifier,
          channel,
          purpose,
          registrationSessionId,
        );
      }

      // 2. Generate secure 6-digit string code and HMAC-SHA256 hash
      const code = String(otpGenerator()).trim().padStart(6, "0");
      const codeHash = hashOtp(code);

      const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
      const resendAfter = new Date(now.getTime() + RESEND_COOLDOWN_SECONDS * 1000);

      // 3. Persist OTP record with hash ONLY (never raw code)
      const savedOtp = await authRepository.saveOtp({
        identifier,
        channel,
        purpose,
        codeHash,
        attempts: 0,
        maxAttempts: MAX_ATTEMPTS,
        expiresAt,
        resendAfter,
        verifiedAt: null,
        metadata: registrationSessionId ? { registrationSessionId } : undefined,
      });

      logger.info(
        {
          event: "OTP_CHALLENGE_CREATED",
          otpId: savedOtp.id,
          registrationSessionId: registrationSessionId || "none",
          verificationType,
          channel,
          purpose,
          destinationMasked: masked,
          expiresAtUtc: expiresAt.toISOString(),
        },
        "[OtpService] Created OTP challenge",
      );

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
          await authRepository.invalidatePreviousOtps(
            identifier,
            channel,
            purpose,
            registrationSessionId,
          );
        } catch {}
        throw dispatchError;
      }

      // 5. Audit log
      await logAuditEvent({
        action: "OTP_REQUESTED",
        entityType: "OtpVerification",
        entityId: savedOtp.id,
        details: {
          channel,
          purpose,
          destination: masked,
          registrationSessionId: registrationSessionId || undefined,
        },
        ipAddress,
        userAgent,
      });

      return {
        success: true,
        message: `Verification code sent to ${masked}`,
        channel,
        type: verificationType,
        challengeId: savedOtp.id,
        destinationMasked: masked,
        cooldownSeconds: RESEND_COOLDOWN_SECONDS,
        expiresInMinutes: OTP_EXPIRY_MINUTES,
      };
    };

    const promise = executeRequest().finally(() => {
      inFlightOtpRequests.delete(lockKey);
    });
    inFlightOtpRequests.set(lockKey, promise);
    return promise;
  },

  /**
   * Verifies an OTP code using constant-time HMAC comparison and atomic challenge consumption.
   */
  async verifyOtp(params: VerifyOtpParams): Promise<VerifyOtpResult> {
    const { channel, purpose, code, registrationSessionId, ipAddress, userAgent } = params;
    const identifier = normalizeIdentifier(params.identifier, channel);
    const verificationType = channelToType(channel);
    const masked = maskDestination(identifier, channel);
    const trimmedCode = String(code ?? "").trim();

    if (!/^\d{6}$/.test(trimmedCode)) {
      return {
        success: false,
        verified: false,
        type: verificationType,
        errorCode: "INVALID_OTP_FORMAT",
        message: "Please enter the complete 6-digit verification code.",
      };
    }

    // 1. Find active unexpired unverified OTP
    const activeOtp = await authRepository.findActiveOtp(
      identifier,
      channel,
      purpose,
      registrationSessionId,
    );

    if (!activeOtp) {
      // Inspect latest OTP record to differentiate missing vs used vs locked vs expired
      const latestOtp = await authRepository.findLatestOtp(
        identifier,
        channel,
        purpose,
        registrationSessionId,
      );

      let lookupResult: string = "not_found";
      let errorCode: OtpVerifyErrorCode = "OTP_NOT_FOUND";
      let message =
        "No active verification code found for this destination. Please request a new verification code.";

      if (latestOtp) {
        if (latestOtp.verifiedAt !== null) {
          lookupResult = "already_used";
          errorCode = "OTP_ALREADY_USED";
          message = "This verification code has already been used. Please request a new one.";
        } else if (latestOtp.attempts >= latestOtp.maxAttempts) {
          lookupResult = "locked";
          errorCode = "OTP_LOCKED";
          message =
            "Too many failed attempts. This code is locked. Please request a new verification code.";
        } else {
          lookupResult = "expired";
          errorCode = "OTP_EXPIRED";
          message = "This verification code has expired (valid for 5 minutes). Please request a new one.";
        }
      }

      logger.warn(
        {
          event: "OTP_VERIFY_LOOKUP_MISS",
          otpId: latestOtp?.id || "none",
          registrationSessionId: registrationSessionId || "none",
          verificationType,
          channel,
          purpose,
          destinationMasked: masked,
          lookupResult,
          expirationValid: false,
          codeComparisonResult: "skipped",
          dbUpdateResult: "none",
        },
        `[OtpService] Verification lookup failed: ${lookupResult}`,
      );

      return {
        success: false,
        verified: false,
        type: verificationType,
        challengeId: latestOtp?.id,
        errorCode,
        message,
      };
    }

    // 2. Explicit UTC expiration check (defense in depth)
    const nowMs = Date.now();
    const expiresAtMs = new Date(activeOtp.expiresAt).getTime();
    const expirationValid = expiresAtMs > nowMs;

    if (!expirationValid) {
      logger.warn(
        {
          event: "OTP_VERIFY_EXPIRED",
          otpId: activeOtp.id,
          registrationSessionId: registrationSessionId || "none",
          verificationType,
          channel,
          purpose,
          destinationMasked: masked,
          lookupResult: "found",
          expirationValid: false,
          codeComparisonResult: "skipped",
          dbUpdateResult: "none",
        },
        "[OtpService] OTP expired on verification",
      );

      return {
        success: false,
        verified: false,
        type: verificationType,
        challengeId: activeOtp.id,
        errorCode: "OTP_EXPIRED",
        message: "This verification code has expired. Please request a new one.",
      };
    }

    // 3. Check if attempts already exceeded max
    if (activeOtp.attempts >= activeOtp.maxAttempts) {
      await authRepository.invalidatePreviousOtps(
        identifier,
        channel,
        purpose,
        registrationSessionId,
      );
      await logAuditEvent({
        action: "OTP_LOCKOUT",
        entityType: "OtpVerification",
        entityId: activeOtp.id,
        details: { channel, purpose, identifier: masked },
        ipAddress,
        userAgent,
      });
      return {
        success: false,
        verified: false,
        type: verificationType,
        challengeId: activeOtp.id,
        errorCode: "OTP_LOCKED",
        message:
          "Too many failed attempts. This code is locked. Please request a new verification code.",
        remainingAttempts: 0,
      };
    }

    // 4. Constant-time HMAC-SHA256 hash verification
    const isMatch = verifyOtpHash(trimmedCode, activeOtp.codeHash);

    if (!isMatch) {
      const currentAttempts = await authRepository.incrementOtpAttempts(activeOtp.id);
      const remaining = Math.max(0, activeOtp.maxAttempts - currentAttempts);

      if (remaining === 0) {
        await authRepository.invalidatePreviousOtps(
          identifier,
          channel,
          purpose,
          registrationSessionId,
        );
      }

      logger.warn(
        {
          event: "OTP_VERIFY_MISMATCH",
          otpId: activeOtp.id,
          registrationSessionId: registrationSessionId || "none",
          verificationType,
          channel,
          purpose,
          destinationMasked: masked,
          lookupResult: "found",
          expirationValid: true,
          codeComparisonResult: "mismatch",
          dbUpdateResult: "incremented_attempts",
          attempts: currentAttempts,
          remainingAttempts: remaining,
        },
        "[OtpService] OTP comparison mismatch",
      );

      await logAuditEvent({
        action: "OTP_FAILED_ATTEMPT",
        entityType: "OtpVerification",
        entityId: activeOtp.id,
        details: { channel, purpose, attempts: currentAttempts, remainingAttempts: remaining },
        ipAddress,
        userAgent,
      });

      return {
        success: false,
        verified: false,
        type: verificationType,
        challengeId: activeOtp.id,
        errorCode: remaining > 0 ? "OTP_INVALID" : "OTP_LOCKED",
        message:
          remaining > 0
            ? `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
            : "Too many failed attempts. Code has been locked. Please request a new one.",
        remainingAttempts: remaining,
      };
    }

    // 5. Atomic challenge consumption + verification token issuance
    const verificationToken = generateSecureToken(32);
    const consumed = await authRepository.consumeActiveOtp(activeOtp.id, verificationToken);

    if (!consumed) {
      logger.warn(
        {
          event: "OTP_VERIFY_RACE_CONFLICT",
          otpId: activeOtp.id,
          registrationSessionId: registrationSessionId || "none",
          verificationType,
          channel,
          purpose,
          destinationMasked: masked,
          lookupResult: "found",
          expirationValid: true,
          codeComparisonResult: "match",
          dbUpdateResult: "conflict",
        },
        "[OtpService] Concurrent verification or expiration prevented token issuance",
      );

      return {
        success: false,
        verified: false,
        type: verificationType,
        challengeId: activeOtp.id,
        errorCode: "OTP_CONSUME_CONFLICT",
        message: "This verification code has already been used or expired. Please request a new one.",
      };
    }

    logger.info(
      {
        event: "OTP_VERIFY_SUCCESS",
        otpId: activeOtp.id,
        registrationSessionId: registrationSessionId || "none",
        verificationType,
        channel,
        purpose,
        destinationMasked: masked,
        lookupResult: "found",
        expirationValid: true,
        codeComparisonResult: "match",
        dbUpdateResult: "verified",
      },
      "[OtpService] OTP verified and consumed atomically",
    );

    await logAuditEvent({
      action: "OTP_VERIFIED",
      entityType: "OtpVerification",
      entityId: activeOtp.id,
      details: {
        channel,
        purpose,
        identifier: masked,
        registrationSessionId: registrationSessionId || undefined,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      verified: true,
      type: verificationType,
      challengeId: activeOtp.id,
      verificationToken,
      message:
        channel === "EMAIL"
          ? "Email verified successfully"
          : "Mobile number verified successfully",
    };
  },

  /**
   * Validates a verification token previously issued upon successful OTP verification.
   */
  async validateVerificationToken(
    token: string,
    expectedChannel: OtpChannel,
    expectedPurpose: OtpPurpose,
    registrationSessionId?: string | null,
  ): Promise<{ valid: boolean; identifier?: string }> {
    if (!token) return { valid: false };

    const record = await authRepository.findOtpByToken(token);
    if (
      !record ||
      !record.verifiedAt ||
      record.channel !== expectedChannel ||
      record.purpose !== expectedPurpose ||
      record.metadata?.used === true
    ) {
      return { valid: false };
    }

    if (
      registrationSessionId &&
      record.metadata?.registrationSessionId &&
      record.metadata.registrationSessionId !== registrationSessionId
    ) {
      return { valid: false };
    }

    // Verification token must be within valid window (60 minutes)
    const tokenAgeMs = Date.now() - new Date(record.verifiedAt).getTime();
    if (tokenAgeMs > 60 * 60 * 1000) {
      return { valid: false };
    }

    return { valid: true, identifier: record.identifier };
  },

  /**
   * Marks a verification token as used so it cannot be reused.
   */
  async consumeVerificationToken(token: string): Promise<void> {
    if (!token) return;
    await authRepository.markTokenUsed(token);
  },

  /**
   * Retrieves live server-side verification status for a specific destination and channel.
   * Backend is the single source of truth.
   */
  async getVerificationStatus(params: {
    identifier: string;
    channel: OtpChannel;
    purpose?: OtpPurpose;
    token?: string | null;
    registrationSessionId?: string | null;
  }): Promise<{ isVerified: boolean; verificationToken: string | null; verifiedAt: Date | null }> {
    const purpose = params.purpose || "REGISTRATION";
    const identifier = normalizeIdentifier(params.identifier, params.channel);

    // 1. If a token was provided, validate it first
    if (params.token) {
      const val = await this.validateVerificationToken(
        params.token,
        params.channel,
        purpose,
        params.registrationSessionId,
      );
      if (val.valid && val.identifier) {
        const normalizedValId = normalizeIdentifier(val.identifier, params.channel);
        if (normalizedValId === identifier) {
          const record = await authRepository.findOtpByToken(params.token);
          return {
            isVerified: true,
            verificationToken: params.token,
            verifiedAt: record?.verifiedAt || null,
          };
        }
      }
    }

    // 2. Otherwise, check if an active verified unexpired record exists for this identifier
    const latestVerified = await authRepository.findLatestVerifiedOtp(
      identifier,
      params.channel,
      purpose,
      params.registrationSessionId,
    );
    if (latestVerified && latestVerified.verificationToken) {
      return {
        isVerified: true,
        verificationToken: latestVerified.verificationToken,
        verifiedAt: latestVerified.verifiedAt,
      };
    }

    return {
      isVerified: false,
      verificationToken: null,
      verifiedAt: null,
    };
  },
};
