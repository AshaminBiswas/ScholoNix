/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { db } from "@/server/database/client";
import { normalizePhone, generateSecureToken } from "@/server/security/crypto";
import { ServiceUnavailableError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export interface OtpRecord {
  id: string;
  identifier: string;
  channel: "EMAIL" | "SMS";
  purpose: "REGISTRATION" | "LOGIN" | "PASSWORD_RESET";
  codeHash: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  resendAfter: Date;
  verifiedAt: Date | null;
  verificationToken?: string | null;
  metadata?: any;
  createdAt: Date;
}

export interface UserRecord {
  id: string;
  schoolId: string;
  name: string;
  email: string | null;
  phone: string | null;
  passwordHash: string;
  role: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED";
  phoneVerified: boolean;
  emailVerified: boolean;
  phoneVerifiedAt: Date | null;
  emailVerifiedAt: Date | null;
  phoneVerificationProvider?: string | null;
  createdAt: Date;
  school?: SchoolRecord | null;
}

export interface SchoolRecord {
  id: string;
  name: string;
  slug: string;
  code: string;
  category?: string | null;
  affiliationBoard?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  website?: string | null;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  pinCode?: string | null;
  country: string;
  status: string;
  plan?: string | null;
  createdAt: Date;
  updatedAt?: Date | null;
}

export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  revokedAt: Date | null;
  createdAt: Date;
  user?: UserRecord | null;
}

export interface PasswordResetRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

// Fallback JSON-persisted store state
interface AuthStoreState {
  otps: Record<string, OtpRecord>;
  users: Record<string, UserRecord>;
  schools: Record<string, SchoolRecord>;
  sessions: Record<string, SessionRecord>;
  passwordResets: Record<string, PasswordResetRecord>;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "auth-store.json");

function ensureStoreDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

let storeMemory: AuthStoreState = {
  otps: {},
  users: {},
  schools: {},
  sessions: {},
  passwordResets: {},
};

function loadStore(): AuthStoreState {
  // In test environment, maintain pure in-memory state and never touch the filesystem
  if (process.env.NODE_ENV === "test") {
    return storeMemory;
  }

  try {
    ensureStoreDir();
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf8");
      const data = JSON.parse(raw);
      // Restore Date objects
      const restoreDates = (obj: unknown): unknown => {
        if (!obj || typeof obj !== "object") return obj;
        const record = obj as Record<string, unknown>;
        for (const [k, v] of Object.entries(record)) {
          if (
            typeof v === "string" &&
            (k.endsWith("At") || k === "expiresAt" || k === "resendAfter") &&
            !isNaN(Date.parse(v))
          ) {
            record[k] = new Date(v);
          } else if (typeof v === "object") {
            restoreDates(v);
          }
        }
        return record;
      };
      return restoreDates(data) as AuthStoreState;
    }
  } catch (err) {
    console.warn("[AuthRepository] Error loading local store, initializing empty:", err);
  }
  return {
    otps: {},
    users: {},
    schools: {},
    sessions: {},
    passwordResets: {},
  };
}

function saveStore(state: AuthStoreState): void {
  storeMemory = state;

  // Never write auth state or tokens to disk during automated test runs
  if (process.env.NODE_ENV === "test") {
    return;
  }

  try {
    ensureStoreDir();
    const tempPath = `${STORE_PATH}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), "utf8");
    try {
      fs.renameSync(tempPath, STORE_PATH);
    } catch {
      fs.copyFileSync(tempPath, STORE_PATH);
    } finally {
      if (fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch {
          // ignore temp cleanup
        }
      }
    }
  } catch (err) {
    console.error("[AuthRepository] Failed to write auth-store:", err);
  }
}

storeMemory = loadStore();

/**
 * Returns true when executing inside an ephemeral serverless runtime (e.g. Vercel),
 * where in-memory RAM / local filesystem cannot be shared across HTTP invocations.
 */
function isServerlessRuntime(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.VERCEL_ENV ||
      process.env.AWS_LAMBDA_FUNCTION_NAME,
  );
}

/**
 * Checks if Prisma is connected and healthy.
 * Never permanently caches `false` so transient cold-start issues self-heal cleanly.
 */
let prismaAvailable: boolean | null = null;
let prismaLastFailureAt = 0;
const PRISMA_RETRY_COOLDOWN_MS = 10_000;

async function isPrismaWorking(): Promise<boolean> {
  // In automated test environments, strictly use ephemeral in-memory state
  if (process.env.NODE_ENV === "test") {
    return false;
  }
  if (prismaAvailable === true) {
    return true;
  }
  if (
    prismaAvailable === false &&
    Date.now() - prismaLastFailureAt < PRISMA_RETRY_COOLDOWN_MS
  ) {
    return false;
  }
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database connection timeout")), 8000),
    );
    await Promise.race([db.$queryRaw`SELECT 1`, timeoutPromise]);
    prismaAvailable = true;
    prismaLastFailureAt = 0;
    return true;
  } catch (err) {
    prismaAvailable = false;
    prismaLastFailureAt = Date.now();
    logger.error(
      { err: err instanceof Error ? err.message : String(err), serverless: isServerlessRuntime() },
      "[AuthRepository] PostgreSQL connectivity check failed",
    );
    return false;
  }
}

function handlePrismaRuntimeError(operation: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  prismaAvailable = false;
  prismaLastFailureAt = Date.now();
  logger.error(
    { operation, error: message, serverless: isServerlessRuntime() },
    `[AuthRepository] Prisma ${operation} failed`,
  );
  if (isServerlessRuntime()) {
    throw new ServiceUnavailableError(
      "Authentication database is temporarily unavailable. Please try again in a moment.",
    );
  }
}

function normalizeChannelIdentifier(identifier: string, channel: "EMAIL" | "SMS"): string {
  return channel === "SMS" ? normalizePhone(identifier) : identifier.trim().toLowerCase();
}

function doesSessionMatch(metadata: unknown, registrationSessionId?: string | null): boolean {
  if (!registrationSessionId) return true;
  const metaSessionId =
    metadata && typeof metadata === "object"
      ? (metadata as Record<string, unknown>).registrationSessionId
      : undefined;
  if (!metaSessionId) return true;
  return metaSessionId === registrationSessionId;
}

function mapPrismaOtpRecord(r: any): OtpRecord {
  const metadataObj = (r.metadata && typeof r.metadata === "object" ? r.metadata : {}) as Record<string, any>;
  return {
    id: r.id,
    identifier: r.identifier,
    channel: r.channel,
    purpose: r.purpose,
    codeHash: r.codeHash,
    attempts: r.attempts,
    maxAttempts: r.maxAttempts,
    expiresAt: new Date(r.expiresAt),
    resendAfter: new Date(r.resendAfter),
    verifiedAt: r.verifiedAt ? new Date(r.verifiedAt) : null,
    verificationToken: metadataObj.token || null,
    metadata: metadataObj,
    createdAt: new Date(r.createdAt),
  };
}

export const authRepository = {
  // ----------------------------------------------------
  // OTP METHODS
  // ----------------------------------------------------

  async saveOtp(record: Omit<OtpRecord, "id" | "createdAt">): Promise<OtpRecord> {
    const id = randomUUID();
    const mergedMetadata: Record<string, any> = {
      ...(record.metadata && typeof record.metadata === "object" ? record.metadata : {}),
      ...(record.verificationToken ? { token: record.verificationToken, used: false } : {}),
    };
    const hasMetadata = Object.keys(mergedMetadata).length > 0;
    const fullRecord: OtpRecord = {
      ...record,
      id,
      metadata: hasMetadata ? mergedMetadata : undefined,
      createdAt: new Date(),
    };

    if (await isPrismaWorking()) {
      try {
        const created = await (db as any).otpVerification.create({
          data: {
            id,
            identifier: record.identifier,
            channel: record.channel,
            purpose: record.purpose,
            codeHash: record.codeHash,
            attempts: record.attempts,
            maxAttempts: record.maxAttempts,
            expiresAt: record.expiresAt,
            resendAfter: record.resendAfter,
            verifiedAt: record.verifiedAt,
            metadata: hasMetadata ? mergedMetadata : undefined,
          },
        });
        const saved = mapPrismaOtpRecord(created);
        if (!isServerlessRuntime()) {
          storeMemory.otps[id] = saved;
          saveStore(storeMemory);
        }
        return saved;
      } catch (err) {
        handlePrismaRuntimeError("saveOtp", err);
      }
    } else if (isServerlessRuntime() && (process.env.NODE_ENV as string) !== "test") {
      throw new ServiceUnavailableError(
        "Authentication database is temporarily unavailable. Please try again in a moment.",
      );
    }

    storeMemory.otps[id] = fullRecord;
    saveStore(storeMemory);
    return fullRecord;
  },

  async findActiveOtp(
    identifier: string,
    channel: "EMAIL" | "SMS",
    purpose: "REGISTRATION" | "LOGIN" | "PASSWORD_RESET",
    registrationSessionId?: string | null,
  ): Promise<OtpRecord | null> {
    const now = new Date();
    const normalizedIdentifier = normalizeChannelIdentifier(identifier, channel);

    if (await isPrismaWorking()) {
      try {
        const candidates = await (db as any).otpVerification.findMany({
          where: {
            OR: [
              { identifier: normalizedIdentifier },
              { identifier: identifier.trim() },
            ],
            channel,
            purpose,
            verifiedAt: null,
            expiresAt: { gt: now },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        });
        const matched = (candidates || []).find(
          (r: any) =>
            r.attempts < r.maxAttempts &&
            doesSessionMatch(r.metadata, registrationSessionId),
        );
        return matched ? mapPrismaOtpRecord(matched) : null;
      } catch (err) {
        handlePrismaRuntimeError("findActiveOtp", err);
      }
    } else if (isServerlessRuntime() && (process.env.NODE_ENV as string) !== "test") {
      throw new ServiceUnavailableError(
        "Authentication database is temporarily unavailable. Please try again in a moment.",
      );
    }

    // Fallback / test store
    const matchesFilter = (otps: Record<string, OtpRecord>) =>
      Object.values(otps).filter(
        (o) =>
          (o.identifier === identifier ||
            o.identifier === normalizedIdentifier ||
            normalizeChannelIdentifier(o.identifier, channel) === normalizedIdentifier) &&
          o.channel === channel &&
          o.purpose === purpose &&
          !o.verifiedAt &&
          o.attempts < o.maxAttempts &&
          new Date(o.expiresAt).getTime() > now.getTime() &&
          doesSessionMatch(o.metadata, registrationSessionId),
      );

    let matches = matchesFilter(storeMemory.otps);
    if (matches.length === 0) {
      storeMemory = loadStore();
      matches = matchesFilter(storeMemory.otps);
    }

    if (matches.length === 0) return null;
    matches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return matches[0] || null;
  },

  async findLatestOtp(
    identifier: string,
    channel: "EMAIL" | "SMS",
    purpose: "REGISTRATION" | "LOGIN" | "PASSWORD_RESET",
    registrationSessionId?: string | null,
  ): Promise<OtpRecord | null> {
    const normalizedIdentifier = normalizeChannelIdentifier(identifier, channel);

    if (await isPrismaWorking()) {
      try {
        const candidates = await (db as any).otpVerification.findMany({
          where: {
            OR: [
              { identifier: normalizedIdentifier },
              { identifier: identifier.trim() },
            ],
            channel,
            purpose,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        });
        const matched = (candidates || []).find((r: any) =>
          doesSessionMatch(r.metadata, registrationSessionId),
        );
        return matched ? mapPrismaOtpRecord(matched) : null;
      } catch (err) {
        handlePrismaRuntimeError("findLatestOtp", err);
      }
    } else if (isServerlessRuntime() && (process.env.NODE_ENV as string) !== "test") {
      throw new ServiceUnavailableError(
        "Authentication database is temporarily unavailable. Please try again in a moment.",
      );
    }

    const matchesFilter = (otps: Record<string, OtpRecord>) =>
      Object.values(otps).filter(
        (o) =>
          (o.identifier === identifier ||
            o.identifier === normalizedIdentifier ||
            normalizeChannelIdentifier(o.identifier, channel) === normalizedIdentifier) &&
          o.channel === channel &&
          o.purpose === purpose &&
          doesSessionMatch(o.metadata, registrationSessionId),
      );

    let matches = matchesFilter(storeMemory.otps);
    if (matches.length === 0) {
      storeMemory = loadStore();
      matches = matchesFilter(storeMemory.otps);
    }

    if (matches.length === 0) return null;
    matches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return matches[0] || null;
  },

  async findOtpByToken(token: string): Promise<OtpRecord | null> {
    if (!token) return null;

    if (await isPrismaWorking()) {
      try {
        const records = await (db as any).$queryRaw`
          SELECT id, identifier, channel, purpose, code_hash AS "codeHash",
                 attempts, max_attempts AS "maxAttempts", expires_at AS "expiresAt",
                 resend_after AS "resendAfter", verified_at AS "verifiedAt",
                 metadata, created_at AS "createdAt"
          FROM otp_verifications
          WHERE metadata->>'token' = ${token}
          ORDER BY created_at DESC
          LIMIT 1
        `;
        if (Array.isArray(records) && records.length > 0) {
          return mapPrismaOtpRecord({ ...records[0], metadata: { ...(records[0].metadata || {}), token } });
        }
        return null;
      } catch (err) {
        handlePrismaRuntimeError("findOtpByToken", err);
      }
    } else if (isServerlessRuntime() && (process.env.NODE_ENV as string) !== "test") {
      throw new ServiceUnavailableError(
        "Authentication database is temporarily unavailable. Please try again in a moment.",
      );
    }

    let found = Object.values(storeMemory.otps).find(
      (o) => o.verificationToken === token || o.metadata?.token === token,
    );
    if (!found) {
      storeMemory = loadStore();
      found = Object.values(storeMemory.otps).find(
        (o) => o.verificationToken === token || o.metadata?.token === token,
      );
    }
    return found || null;
  },

  async markTokenUsed(token: string): Promise<void> {
    if (!token) return;
    const now = new Date();

    if (await isPrismaWorking()) {
      try {
        await (db as any).$executeRaw`
          UPDATE otp_verifications
          SET metadata = jsonb_set(
            jsonb_set(COALESCE(metadata, '{}'::jsonb), '{used}', 'true'::jsonb),
            '{usedAt}', to_jsonb(${now.toISOString()}::text)
          )
          WHERE metadata->>'token' = ${token}
        `;
        return;
      } catch (err) {
        handlePrismaRuntimeError("markTokenUsed", err);
      }
    } else if (isServerlessRuntime() && (process.env.NODE_ENV as string) !== "test") {
      throw new ServiceUnavailableError(
        "Authentication database is temporarily unavailable. Please try again in a moment.",
      );
    }

    for (const otp of Object.values(storeMemory.otps)) {
      if (otp.verificationToken === token || otp.metadata?.token === token) {
        otp.metadata = { ...(otp.metadata || {}), used: true, usedAt: now.toISOString() };
      }
    }
    saveStore(storeMemory);
  },

  async findLatestVerifiedOtp(
    identifier: string,
    channel: "EMAIL" | "SMS",
    purpose: "REGISTRATION" | "LOGIN" | "PASSWORD_RESET",
    registrationSessionId?: string | null,
  ): Promise<OtpRecord | null> {
    const normalizedIdentifier = normalizeChannelIdentifier(identifier, channel);
    const maxAgeMs = 60 * 60 * 1000; // Verified within last 60 minutes
    const cutoff = new Date(Date.now() - maxAgeMs);

    if (await isPrismaWorking()) {
      try {
        const records = await (db as any).$queryRaw`
          SELECT id, identifier, channel, purpose, code_hash AS "codeHash",
                 attempts, max_attempts AS "maxAttempts", expires_at AS "expiresAt",
                 resend_after AS "resendAfter", verified_at AS "verifiedAt",
                 metadata, created_at AS "createdAt"
          FROM otp_verifications
          WHERE (identifier = ${normalizedIdentifier} OR identifier = ${identifier.trim()})
            AND channel = ${channel}::"OtpChannel"
            AND purpose = ${purpose}::"OtpPurpose"
            AND verified_at IS NOT NULL
            AND verified_at > ${cutoff}
            AND (metadata->>'used' IS NULL OR metadata->>'used' = 'false')
          ORDER BY verified_at DESC
          LIMIT 10
        `;
        if (Array.isArray(records)) {
          const matched = records.find((r: any) =>
            doesSessionMatch(r.metadata, registrationSessionId),
          );
          if (matched) {
            return mapPrismaOtpRecord(matched);
          }
        }
        return null;
      } catch (err) {
        handlePrismaRuntimeError("findLatestVerifiedOtp", err);
      }
    } else if (isServerlessRuntime() && (process.env.NODE_ENV as string) !== "test") {
      throw new ServiceUnavailableError(
        "Authentication database is temporarily unavailable. Please try again in a moment.",
      );
    }

    const matchesFilter = (otps: Record<string, OtpRecord>) =>
      Object.values(otps).filter(
        (o) =>
          (o.identifier === identifier ||
            o.identifier === normalizedIdentifier ||
            normalizeChannelIdentifier(o.identifier, channel) === normalizedIdentifier) &&
          o.channel === channel &&
          o.purpose === purpose &&
          o.verifiedAt !== null &&
          new Date(o.verifiedAt).getTime() > cutoff.getTime() &&
          o.metadata?.used !== true &&
          doesSessionMatch(o.metadata, registrationSessionId),
      );

    let matches = matchesFilter(storeMemory.otps);
    if (matches.length === 0) {
      storeMemory = loadStore();
      matches = matchesFilter(storeMemory.otps);
    }
    if (matches.length === 0) return null;
    matches.sort((a, b) => new Date(b.verifiedAt!).getTime() - new Date(a.verifiedAt!).getTime());
    return matches[0] || null;
  },

  async incrementOtpAttempts(id: string): Promise<number> {
    if (await isPrismaWorking()) {
      try {
        const updated = await (db as any).otpVerification.update({
          where: { id },
          data: { attempts: { increment: 1 } },
        });
        return updated.attempts;
      } catch (err) {
        handlePrismaRuntimeError("incrementOtpAttempts", err);
      }
    } else if (isServerlessRuntime() && (process.env.NODE_ENV as string) !== "test") {
      throw new ServiceUnavailableError(
        "Authentication database is temporarily unavailable. Please try again in a moment.",
      );
    }

    const otp = storeMemory.otps[id];
    if (otp) {
      otp.attempts += 1;
      saveStore(storeMemory);
      return otp.attempts;
    }
    return 1;
  },

  /**
   * Atomically marks an active, unexpired, unlocked OTP as verified and issues the verification token.
   * Returns false if a concurrent request already consumed, locked, or expired this challenge.
   */
  async consumeActiveOtp(id: string, token: string): Promise<boolean> {
    const now = new Date();

    if (await isPrismaWorking()) {
      try {
        const updatedCount = await (db as any).$executeRaw`
          UPDATE otp_verifications
          SET verified_at = ${now},
              metadata = jsonb_set(
                jsonb_set(COALESCE(metadata, '{}'::jsonb), '{token}', to_jsonb(${token}::text)),
                '{used}', 'false'::jsonb
              )
          WHERE id = ${id}::uuid
            AND verified_at IS NULL
            AND expires_at > ${now}
            AND attempts < max_attempts
        `;
        if (storeMemory.otps[id]) {
          storeMemory.otps[id].verifiedAt = now;
          storeMemory.otps[id].verificationToken = token;
          storeMemory.otps[id].metadata = {
            ...(storeMemory.otps[id].metadata || {}),
            token,
            used: false,
          };
          if (!isServerlessRuntime()) saveStore(storeMemory);
        }
        return Number(updatedCount) === 1;
      } catch (err) {
        handlePrismaRuntimeError("consumeActiveOtp", err);
      }
    } else if (isServerlessRuntime() && (process.env.NODE_ENV as string) !== "test") {
      throw new ServiceUnavailableError(
        "Authentication database is temporarily unavailable. Please try again in a moment.",
      );
    }

    const otp = storeMemory.otps[id];
    if (
      !otp ||
      otp.verifiedAt !== null ||
      new Date(otp.expiresAt).getTime() <= now.getTime() ||
      otp.attempts >= otp.maxAttempts
    ) {
      return false;
    }
    otp.verifiedAt = now;
    otp.verificationToken = token;
    otp.metadata = { ...(otp.metadata || {}), token, used: false };
    saveStore(storeMemory);
    return true;
  },

  async markOtpVerified(id: string, token: string): Promise<void> {
    await this.consumeActiveOtp(id, token);
  },

  async invalidatePreviousOtps(
    identifier: string,
    channel: "EMAIL" | "SMS",
    purpose: "REGISTRATION" | "LOGIN" | "PASSWORD_RESET",
    registrationSessionId?: string | null,
  ): Promise<void> {
    const now = new Date();
    const normalizedIdentifier = normalizeChannelIdentifier(identifier, channel);

    if (await isPrismaWorking()) {
      try {
        if (registrationSessionId) {
          await (db as any).$executeRaw`
            UPDATE otp_verifications
            SET expires_at = ${now}
            WHERE (identifier = ${normalizedIdentifier} OR identifier = ${identifier.trim()})
              AND channel = ${channel}::"OtpChannel"
              AND purpose = ${purpose}::"OtpPurpose"
              AND verified_at IS NULL
              AND (metadata->>'registrationSessionId' IS NULL OR metadata->>'registrationSessionId' = ${registrationSessionId})
          `;
        } else {
          await (db as any).otpVerification.updateMany({
            where: {
              OR: [
                { identifier: normalizedIdentifier },
                { identifier: identifier.trim() },
              ],
              channel,
              purpose,
              verifiedAt: null,
            },
            data: {
              expiresAt: now,
            },
          });
        }
        return;
      } catch (err) {
        handlePrismaRuntimeError("invalidatePreviousOtps", err);
      }
    } else if (isServerlessRuntime() && (process.env.NODE_ENV as string) !== "test") {
      throw new ServiceUnavailableError(
        "Authentication database is temporarily unavailable. Please try again in a moment.",
      );
    }

    for (const otp of Object.values(storeMemory.otps)) {
      if (
        (otp.identifier === identifier ||
          otp.identifier === normalizedIdentifier ||
          normalizeChannelIdentifier(otp.identifier, channel) === normalizedIdentifier) &&
        otp.channel === channel &&
        otp.purpose === purpose &&
        !otp.verifiedAt &&
        doesSessionMatch(otp.metadata, registrationSessionId)
      ) {
        otp.expiresAt = now;
      }
    }
    saveStore(storeMemory);
  },

  /**
   * Issues a valid verification token for a verified phone number.
   */
  async createVerifiedPhoneToken(
    phone: string,
    purpose: "REGISTRATION" | "LOGIN" | "PASSWORD_RESET" = "REGISTRATION",
    provider: string = "SMS_OTP",
  ): Promise<string> {
    const verificationToken = generateSecureToken(32);
    const normalizedPhone = normalizePhone(phone);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour validity

    await this.saveOtp({
      identifier: normalizedPhone,
      channel: "SMS",
      purpose,
      codeHash: `VERIFIED_${provider}`,
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
      resendAfter: now,
      verifiedAt: now,
      verificationToken,
    });

    return verificationToken;
  },

  // ----------------------------------------------------
  // USER & SCHOOL METHODS
  // ----------------------------------------------------

  async findUserByIdentifier(identifier: string): Promise<UserRecord | null> {
    const clean = identifier.trim().toLowerCase();
    const phoneClean = identifier.replace(/[^\d+]/g, "").trim();
    const normalizedPhone = normalizePhone(identifier);

    if (await isPrismaWorking()) {
      try {
        const user = await (db as any).user.findFirst({
          where: {
            OR: [
              { email: { equals: clean, mode: "insensitive" } },
              { phone: identifier.replace(/\s+/g, "") },
              { phone: phoneClean },
              { phone: normalizedPhone },
            ],
          },
          include: { school: true },
        });
        return user ? (user as unknown as UserRecord) : null;
      } catch (err) {
        handlePrismaRuntimeError("findUserByIdentifier", err);
      }
    } else if (isServerlessRuntime() && (process.env.NODE_ENV as string) !== "test") {
      throw new ServiceUnavailableError(
        "Authentication database is temporarily unavailable. Please try again in a moment.",
      );
    }

    const userMatches = (users: Record<string, UserRecord>) =>
      Object.values(users).find((u) => {
        if (u.email && u.email.toLowerCase() === clean) return true;
        if (u.phone) {
          const uClean = u.phone.replace(/[^\d+]/g, "");
          if (
            u.phone === identifier ||
            uClean === phoneClean ||
            u.phone === normalizedPhone ||
            normalizePhone(u.phone) === normalizedPhone ||
            (phoneClean.length >= 10 && uClean.endsWith(phoneClean.slice(-10)))
          ) {
            return true;
          }
        }
        return false;
      });

    let found = userMatches(storeMemory.users);
    if (!found) {
      storeMemory = loadStore();
      found = userMatches(storeMemory.users);
    }

    if (found) {
      const school = await this.findSchoolById(found.schoolId);
      return { ...found, school };
    }
    return null;
  },

  async findUserById(id: string): Promise<UserRecord | null> {
    if (await isPrismaWorking()) {
      try {
        const user = await (db as any).user.findUnique({
          where: { id },
          include: { school: true },
        });
        if (user) return user as unknown as UserRecord;
      } catch {
        // Fallback
      }
    }

    let found = storeMemory.users[id];
    if (!found) {
      storeMemory = loadStore();
      found = storeMemory.users[id];
    }
    if (found) {
      const school = await this.findSchoolById(found.schoolId);
      return { ...found, school };
    }
    return null;
  },

  async findSchoolById(id: string): Promise<SchoolRecord | null> {
    if (await isPrismaWorking()) {
      try {
        const school = await (db as any).school.findUnique({
          where: { id },
        });
        if (school) return school as unknown as SchoolRecord;
      } catch {
        // Fallback
      }
    }
    if (!storeMemory.schools[id]) {
      storeMemory = loadStore();
    }
    return storeMemory.schools[id] || Object.values(storeMemory.schools).find((s) => s.slug === id || s.code === id) || null;
  },

  async getAllSchools(): Promise<SchoolRecord[]> {
    if (await isPrismaWorking()) {
      try {
        const schools = await (db as any).school.findMany({
          orderBy: { name: "asc" },
        });
        if (schools && schools.length > 0) return schools as unknown as SchoolRecord[];
      } catch {
        // Fallback
      }
    }
    storeMemory = loadStore();
    return Object.values(storeMemory.schools);
  },

  async createUserWithSchool(params: {
    school: {
      name: string;
      slug: string;
      code: string;
      category: string;
      affiliationBoard?: string;
      contactPhone?: string;
      contactEmail?: string;
      website?: string;
      addressLine?: string;
      city?: string;
      state?: string;
      pinCode?: string;
      country?: string;
      plan?: string;
    };
    user: {
      name: string;
      email: string;
      phone: string;
      passwordHash: string;
      role: string;
      phoneVerified?: boolean;
      emailVerified?: boolean;
    };
  }): Promise<{ user: UserRecord; school: SchoolRecord }> {
    const schoolId = randomUUID();
    const userId = randomUUID();
    const now = new Date();

    const schoolRecord: SchoolRecord = {
      id: schoolId,
      name: params.school.name.trim(),
      slug: params.school.slug.trim(),
      code: params.school.code.trim(),
      category: params.school.category,
      affiliationBoard: params.school.affiliationBoard || "CBSE",
      contactPhone: params.school.contactPhone || null,
      contactEmail: params.school.contactEmail || null,
      website: params.school.website || null,
      addressLine: params.school.addressLine || null,
      city: params.school.city || null,
      state: params.school.state || null,
      pinCode: params.school.pinCode || null,
      country: params.school.country || "India",
      status: "TRIAL",
      plan: params.school.plan || "starter",
      createdAt: now,
    };

    const userRecord: UserRecord = {
      id: userId,
      schoolId,
      name: params.user.name.trim(),
      email: params.user.email.trim().toLowerCase(),
      phone: params.user.phone.replace(/\s+/g, ""),
      passwordHash: params.user.passwordHash,
      role: params.user.role || "SCHOOL_ADMIN",
      status: "ACTIVE",
      phoneVerified: params.user.phoneVerified ?? true,
      emailVerified: params.user.emailVerified ?? true,
      phoneVerifiedAt: params.user.phoneVerified ? now : null,
      emailVerifiedAt: params.user.emailVerified ? now : null,
      createdAt: now,
      school: schoolRecord,
    };

    if (await isPrismaWorking()) {
      try {
        const result = await (db as any).$transaction(async (tx: any) => {
          const createdSchool = await tx.school.create({
            data: {
              id: schoolId,
              name: schoolRecord.name,
              slug: schoolRecord.slug,
              code: schoolRecord.code,
              category: schoolRecord.category,
              affiliationBoard: schoolRecord.affiliationBoard,
              contactPhone: schoolRecord.contactPhone || "",
              contactEmail: schoolRecord.contactEmail,
              website: schoolRecord.website,
              addressLine: schoolRecord.addressLine || "",
              city: schoolRecord.city || "",
              state: schoolRecord.state || "",
              pinCode: schoolRecord.pinCode || "",
              country: schoolRecord.country,
              status: "TRIAL",
            },
          });

          const createdUser = await tx.user.create({
            data: {
              id: userId,
              schoolId: createdSchool.id,
              name: userRecord.name,
              email: userRecord.email,
              phone: userRecord.phone,
              passwordHash: userRecord.passwordHash,
              role: userRecord.role,
              status: userRecord.status,
              phoneVerified: userRecord.phoneVerified,
              emailVerified: userRecord.emailVerified,
              phoneVerifiedAt: userRecord.phoneVerifiedAt,
              emailVerifiedAt: userRecord.emailVerifiedAt,
            },
          });

          return { createdSchool, createdUser };
        });

        const createdSchoolRecord = result.createdSchool as unknown as SchoolRecord;
        const createdUserRecord = {
          ...(result.createdUser as unknown as UserRecord),
          school: createdSchoolRecord,
        };

        if (!isServerlessRuntime()) {
          storeMemory.schools[schoolId] = createdSchoolRecord;
          storeMemory.users[userId] = createdUserRecord;
          saveStore(storeMemory);
        }

        return {
          user: createdUserRecord,
          school: createdSchoolRecord,
        };
      } catch (err: any) {
        if (err?.code === "P2002") {
          throw err;
        }
        handlePrismaRuntimeError("createUserWithSchool", err);
      }
    } else if (isServerlessRuntime() && (process.env.NODE_ENV as string) !== "test") {
      throw new ServiceUnavailableError(
        "Authentication database is temporarily unavailable. Please try again in a moment.",
      );
    }

    storeMemory.schools[schoolId] = schoolRecord;
    storeMemory.users[userId] = userRecord;
    saveStore(storeMemory);

    return { user: userRecord, school: schoolRecord };
  },

  async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
    if (await isPrismaWorking()) {
      try {
        await (db as any).user.update({
          where: { id: userId },
          data: { passwordHash: newPasswordHash },
        });
        return;
      } catch {
        // Fallback
      }
    }

    const user = storeMemory.users[userId];
    if (user) {
      user.passwordHash = newPasswordHash;
      saveStore(storeMemory);
    }
  },

  /**
   * Updates a user's phone number and verification status following successful
   * phone number verification (e.g. verified SMS OTP).
   */
  async updateUserPhoneVerification(
    userId: string,
    phone: string,
    provider: string = "SMS_OTP",
  ): Promise<UserRecord | null> {
    const now = new Date();
    const normalizedPhone = normalizePhone(phone);

    if (await isPrismaWorking()) {
      try {
        const updated = await (db as any).user.update({
          where: { id: userId },
          data: {
            phone: normalizedPhone,
            phoneVerified: true,
            phoneVerifiedAt: now,
            phoneVerificationProvider: provider,
          },
          include: { school: true },
        });
        if (updated) {
          storeMemory.users[userId] = updated as unknown as UserRecord;
          saveStore(storeMemory);
          return updated as unknown as UserRecord;
        }
      } catch {
        console.warn("[AuthRepository] Prisma updateUserPhoneVerification failed, falling back");
      }
    }

    if (!storeMemory.users[userId]) {
      storeMemory = loadStore();
    }
    const user = storeMemory.users[userId];
    if (user) {
      user.phone = normalizedPhone;
      user.phoneVerified = true;
      user.phoneVerifiedAt = now;
      user.phoneVerificationProvider = provider;
      saveStore(storeMemory);
      const school = await this.findSchoolById(user.schoolId);
      return { ...user, school };
    }
    return null;
  },

  /**
   * Checks whether a phone number is registered by any user, optionally excluding a specific user ID.
   */
  async findUserByPhone(phone: string, excludeUserId?: string): Promise<UserRecord | null> {
    const normalizedPhone = normalizePhone(phone);
    const phoneClean = phone.replace(/[^\d+]/g, "").trim();

    if (await isPrismaWorking()) {
      try {
        const user = await (db as any).user.findFirst({
          where: {
            OR: [
              { phone: normalizedPhone },
              { phone: phoneClean },
              { phone: phone.replace(/\s+/g, "") },
            ],
            ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
          },
          include: { school: true },
        });
        if (user) return user as unknown as UserRecord;
      } catch {
        // Fallback
      }
    }

    const users = storeMemory.users || {};
    for (const u of Object.values(users)) {
      if (excludeUserId && u.id === excludeUserId) continue;
      if (!u.phone) continue;
      const uClean = u.phone.replace(/[^\d+]/g, "");
      if (
        u.phone === normalizedPhone ||
        uClean === phoneClean ||
        normalizePhone(u.phone) === normalizedPhone ||
        (phoneClean.length >= 10 && uClean.endsWith(phoneClean.slice(-10)))
      ) {
        const school = await this.findSchoolById(u.schoolId);
        return { ...u, school };
      }
    }

    storeMemory = loadStore();
    for (const u of Object.values(storeMemory.users)) {
      if (excludeUserId && u.id === excludeUserId) continue;
      if (!u.phone) continue;
      const uClean = u.phone.replace(/[^\d+]/g, "");
      if (
        u.phone === normalizedPhone ||
        uClean === phoneClean ||
        normalizePhone(u.phone) === normalizedPhone ||
        (phoneClean.length >= 10 && uClean.endsWith(phoneClean.slice(-10)))
      ) {
        const school = await this.findSchoolById(u.schoolId);
        return { ...u, school };
      }
    }

    return null;
  },

  // ----------------------------------------------------
  // SESSION METHODS
  // ----------------------------------------------------

  async createSession(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<SessionRecord> {
    const id = randomUUID();
    const record: SessionRecord = {
      id,
      userId: params.userId,
      tokenHash: params.tokenHash,
      expiresAt: params.expiresAt,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      revokedAt: null,
      createdAt: new Date(),
    };

    if (await isPrismaWorking()) {
      try {
        const created = await (db as any).userSession.create({
          data: {
            id,
            userId: params.userId,
            tokenHash: params.tokenHash,
            expiresAt: params.expiresAt,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
          },
        });
        const createdRecord = created as unknown as SessionRecord;
        if (!isServerlessRuntime()) {
          storeMemory.sessions[id] = createdRecord;
          saveStore(storeMemory);
        }
        return createdRecord;
      } catch (err) {
        handlePrismaRuntimeError("createSession", err);
      }
    } else if (isServerlessRuntime() && (process.env.NODE_ENV as string) !== "test") {
      throw new ServiceUnavailableError(
        "Authentication database is temporarily unavailable. Please try again in a moment.",
      );
    }

    storeMemory.sessions[id] = record;
    saveStore(storeMemory);
    return record;
  },

  async findSessionByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    const now = new Date();

    if (await isPrismaWorking()) {
      try {
        const session = await (db as any).userSession.findFirst({
          where: {
            tokenHash,
            revokedAt: null,
            expiresAt: { gt: now },
          },
          include: {
            user: {
              include: { school: true },
            },
          },
        });
        if (session) return session as unknown as SessionRecord;
      } catch {
        // Fallback
      }
    }

    let found = Object.values(storeMemory.sessions).find(
      (s) => s.tokenHash === tokenHash && !s.revokedAt && new Date(s.expiresAt).getTime() > now.getTime(),
    );

    if (!found) {
      storeMemory = loadStore();
      found = Object.values(storeMemory.sessions).find(
        (s) => s.tokenHash === tokenHash && !s.revokedAt && new Date(s.expiresAt).getTime() > now.getTime(),
      );
    }

    if (found) {
      const user = await this.findUserById(found.userId);
      return { ...found, user };
    }
    return null;
  },

  async revokeSession(tokenHash: string): Promise<void> {
    const now = new Date();

    if (await isPrismaWorking()) {
      try {
        await (db as any).userSession.updateMany({
          where: { tokenHash },
          data: { revokedAt: now },
        });
        return;
      } catch {
        // Fallback
      }
    }

    for (const s of Object.values(storeMemory.sessions)) {
      if (s.tokenHash === tokenHash) {
        s.revokedAt = now;
      }
    }
    saveStore(storeMemory);
  },
};
