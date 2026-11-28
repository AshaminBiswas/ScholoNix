/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { createHash, randomBytes, randomUUID } from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/database/client";
import { authRepository } from "@/server/auth/auth-repository";
import {
  getDummyPasswordHash,
  hashPassword,
  verifyPassword,
} from "@/server/security/crypto";
import {
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from "@/lib/errors";
import {
  buildOtpAuthUri,
  decryptTotpSecretWithRotation,
  encryptTotpSecret,
  generateBase32Secret,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyPasskeyAssertion,
  verifyPasskeyRegistrationClientData,
  verifyTotpCode,
  verifyWebAuthnChallengeToken,
} from "./platform-mfa-crypto";
import { platformCache } from "./platform-cache";
import type {
  PlatformAdminPasskeyRecord,
  PlatformAdminRecord,
  PlatformAdminRoleValue,
  PlatformAdminStatusValue,
} from "@/modules/platform/types";
import type {
  CreatePlatformAdminInput,
  UpdatePlatformAdminInput,
} from "@/modules/platform/schemas";

const PLATFORM_TX_OPTIONS = { maxWait: 10_000, timeout: 25_000 };
const PLATFORM_SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface StoredPlatformAdmin extends PlatformAdminRecord {
  passwordHash: string;
  totpSecretEnc: string | null;
  recoveryCodeHashes: string[];
}

interface StoredPlatformAdminSession {
  id: string;
  adminId: string;
  tokenHash: string;
  mfaVerified: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
}

interface StoredPlatformAdminPasskey {
  id: string;
  adminId: string;
  credentialId: string;
  publicKeySpki: string;
  algorithm: number;
  deviceName: string;
  counter: number;
  lastUsedAt: Date | null;
  createdAt: Date;
}

export interface PlatformSessionContext {
  admin: PlatformAdminRecord;
  mfaVerified: boolean;
  token: string;
}

const memoryAdmins: Record<string, StoredPlatformAdmin> = {};
const memoryAdminSessions: Record<string, StoredPlatformAdminSession> = {};
const memoryPasskeys: Record<string, StoredPlatformAdminPasskey> = {};

export function getPlatformAdminCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Host-platform_admin_session"
    : "platform_admin_session";
}

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function runAdminTx<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('app.platform_admin', 'true', true)`;
    return fn(tx);
  }, PLATFORM_TX_OPTIONS);
}

async function getPlatformSchemaStatus(tx: Prisma.TransactionClient): Promise<{
  hasAdmins: boolean;
  hasMfaSchema: boolean;
}> {
  try {
    const rows = (await tx.$queryRaw`
      SELECT
        to_regclass('public.platform_admins') IS NOT NULL AS admins_exists,
        to_regclass('public.platform_admin_passkeys') IS NOT NULL AS passkeys_exists,
        EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'platform_admins'
            AND column_name = 'must_change_password'
        ) AS mfa_cols_exists,
        EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'platform_admins'
            AND column_name = 'email_verified_at'
        ) AS contact_cols_exists
    `) as Array<{
      admins_exists?: boolean;
      passkeys_exists?: boolean;
      mfa_cols_exists?: boolean;
      contact_cols_exists?: boolean;
    }>;
    const row = rows[0];
    return {
      hasAdmins: Boolean(row?.admins_exists),
      hasMfaSchema: Boolean(
        row?.admins_exists &&
          row?.passkeys_exists &&
          row?.mfa_cols_exists &&
          row?.contact_cols_exists,
      ),
    };
  } catch {
    return { hasAdmins: false, hasMfaSchema: false };
  }
}

async function assertPlatformMfaSchema(tx: Prisma.TransactionClient): Promise<void> {
  const status = await getPlatformSchemaStatus(tx);
  if (!status.hasAdmins) {
    throw new ServiceUnavailableError(
      "Company admins table (`platform_admins`) is not provisioned yet. Run migration SQL in Supabase.",
    );
  }
  if (!status.hasMfaSchema) {
    throw new ServiceUnavailableError(
      "Company Admin MFA & Contact Verification migrations (`20261127130000` & `20261127140000`) are not provisioned yet. Run their SQL in Supabase.",
    );
  }
}

function mapPasskeyRow(row: any): PlatformAdminPasskeyRecord {
  return {
    id: row.id,
    adminId: row.adminId,
    credentialId: row.credentialId,
    deviceName: row.deviceName,
    algorithm: Number(row.algorithm ?? -7),
    lastUsedAt: row.lastUsedAt ? new Date(row.lastUsedAt).toISOString() : null,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

function mapAdminRow(row: any): PlatformAdminRecord {
  const passkeys = Array.isArray(row.passkeys) ? row.passkeys.map(mapPasskeyRow) : undefined;
  const passkeyCount =
    row._count?.passkeys !== undefined
      ? Number(row._count.passkeys)
      : passkeys
        ? passkeys.length
        : undefined;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? null,
    role: (row.role as PlatformAdminRoleValue) || "OPERATIONS",
    status: (row.status as PlatformAdminStatusValue) || "ACTIVE",
    department: row.department ?? null,
    lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt).toISOString() : null,
    createdByAdminId: row.createdByAdminId ?? null,
    mustChangePassword: Boolean(row.mustChangePassword ?? false),
    passwordChangedAt: row.passwordChangedAt
      ? new Date(row.passwordChangedAt).toISOString()
      : null,
    emailVerifiedAt: row.emailVerifiedAt
      ? new Date(row.emailVerifiedAt).toISOString()
      : null,
    phoneVerifiedAt: row.phoneVerifiedAt
      ? new Date(row.phoneVerifiedAt).toISOString()
      : null,
    twoFactorEnabled: Boolean(row.twoFactorEnabled ?? false),
    passkeyCount,
    passkeys,
    activeSessionCount: row._count?.sessions ?? undefined,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

function toSafeMemoryAdmin(admin: StoredPlatformAdmin): PlatformAdminRecord {
  const passkeys = Object.values(memoryPasskeys)
    .filter((pk) => pk.adminId === admin.id)
    .map(mapPasskeyRow);
  const {
    passwordHash: _ph,
    totpSecretEnc: _totp,
    recoveryCodeHashes: _rec,
    ...safe
  } = admin;
  void _ph;
  void _totp;
  void _rec;
  return {
    ...safe,
    passkeyCount: passkeys.length,
    passkeys,
  };
}

export function isPlatformAdminFullyVerified(
  admin: PlatformAdminRecord,
  mfaVerified: boolean,
): boolean {
  const hasAnyMfaEnrolled = admin.twoFactorEnabled || (admin.passkeyCount ?? 0) > 0;
  const contactsVerified = Boolean(admin.emailVerifiedAt) && Boolean(admin.phoneVerifiedAt);
  return !admin.mustChangePassword && contactsVerified && mfaVerified && hasAnyMfaEnrolled;
}

function verifyTotpOrRecoveryInput(
  totpSecretEnc: string,
  recoveryHashes: string[],
  codeInput: string,
): {
  usedRecoveryCode: boolean;
  remainingHashes: string[];
  reencryptedTotpSecretEnc?: string;
} {
  let decryptFailedDueToKeyMismatch = false;
  let totpOk = false;
  let reencryptedTotpSecretEnc: string | undefined;

  try {
    const decrypted = decryptTotpSecretWithRotation(totpSecretEnc);
    totpOk = verifyTotpCode(decrypted.secret, codeInput);
    if (totpOk && decrypted.rotatedFromPreviousKey) {
      reencryptedTotpSecretEnc = encryptTotpSecret(decrypted.secret);
    }
  } catch {
    decryptFailedDueToKeyMismatch = true;
  }

  if (totpOk) {
    return {
      usedRecoveryCode: false,
      remainingHashes: recoveryHashes,
      reencryptedTotpSecretEnc,
    };
  }

  const candidateHash = hashRecoveryCode(codeInput);
  const idx = recoveryHashes.indexOf(candidateHash);
  if (idx !== -1) {
    return {
      usedRecoveryCode: true,
      remainingHashes: recoveryHashes.filter((_, i) => i !== idx),
    };
  }

  if (decryptFailedDueToKeyMismatch) {
    throw new ValidationError(
      "Unable to verify authenticator code because AUTH_SECRET differs from the key used during 2FA setup. Sign in with a saved backup recovery code, restore AUTH_SECRET (or add the prior secret to AUTH_SECRET_PREVIOUS), or reset 2FA for this admin.",
    );
  }

  throw new ValidationError("Invalid 6-digit authenticator code or recovery code.");
}

export const platformAdminAuthService = {
  setSessionCookie(response: NextResponse, token: string, expiresAt: Date): void {
    response.cookies.set(getPlatformAdminCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });
  },

  clearSessionCookie(response: NextResponse): void {
    response.cookies.set(getPlatformAdminCookieName(), "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  },

  async authenticateAndCreateSession(
    emailInput: string,
    password: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<{
    admin: PlatformAdminRecord;
    token: string;
    expiresAt: Date;
    mfaVerified: boolean;
  } | null> {
    const cleanEmail = emailInput.trim().toLowerCase();
    const now = new Date();
    const token = randomBytes(32).toString("hex");
    const tokenHash = hashSessionToken(token);
    const expiresAt = new Date(now.getTime() + PLATFORM_SESSION_TTL_SECONDS * 1000);

    if (await authRepository.canUsePrismaForPlatform()) {
      return runAdminTx(async (tx) => {
        await assertPlatformMfaSchema(tx);
        const row = await (tx as any).platformAdmin.findUnique({
          where: { email: cleanEmail },
          include: { _count: { select: { passkeys: true } } },
        });
        if (!row) {
          await verifyPassword(password, await getDummyPasswordHash());
          return null;
        }
        const valid = await verifyPassword(password, row.passwordHash);
        if (!valid) return null;
        if (row.status !== "ACTIVE") {
          throw new ValidationError("This Company Admin account is suspended or inactive.");
        }

        await (tx as any).platformAdmin.update({
          where: { id: row.id },
          data: { lastLoginAt: now },
        });
        await (tx as any).platformAdminSession.create({
          data: {
            adminId: row.id,
            tokenHash,
            mfaVerified: false,
            ipAddress: meta?.ipAddress?.slice(0, 45) ?? null,
            userAgent: meta?.userAgent ?? null,
            expiresAt,
          },
        });

        return {
          admin: mapAdminRow({ ...row, lastLoginAt: now }),
          token,
          expiresAt,
          mfaVerified: false,
        };
      });
    }

    const found = Object.values(memoryAdmins).find(
      (a) => a.email.toLowerCase() === cleanEmail,
    );
    if (!found) {
      await verifyPassword(password, await getDummyPasswordHash());
      return null;
    }
    const valid = await verifyPassword(password, found.passwordHash);
    if (!valid) return null;
    if (found.status !== "ACTIVE") {
      throw new ValidationError("This Company Admin account is suspended or inactive.");
    }

    found.lastLoginAt = now.toISOString();
    const sessId = randomUUID();
    memoryAdminSessions[sessId] = {
      id: sessId,
      adminId: found.id,
      tokenHash,
      mfaVerified: false,
      ipAddress: meta?.ipAddress ?? null,
      userAgent: meta?.userAgent ?? null,
      expiresAt,
      revokedAt: null,
    };

    return {
      admin: toSafeMemoryAdmin(found),
      token,
      expiresAt,
      mfaVerified: false,
    };
  },

  async verifySessionToken(
    token: string,
  ): Promise<{ admin: PlatformAdminRecord; mfaVerified: boolean } | null> {
    if (!token) return null;
    const tokenHash = hashSessionToken(token);
    const cached = await platformCache.getCachedAdminSession(tokenHash);
    if (cached) {
      return cached;
    }

    const now = new Date();

    if (await authRepository.canUsePrismaForPlatform()) {
      try {
        const result = await runAdminTx(async (tx) => {
          const status = await getPlatformSchemaStatus(tx);
          if (!status.hasMfaSchema) return null;
          const sess = await (tx as any).platformAdminSession.findFirst({
            where: {
              tokenHash,
              revokedAt: null,
              expiresAt: { gt: now },
            },
            include: {
              admin: {
                include: {
                  passkeys: { orderBy: { createdAt: "desc" } },
                  _count: { select: { passkeys: true } },
                },
              },
            },
          });
          if (!sess || !sess.admin || sess.admin.status !== "ACTIVE") return null;
          return {
            admin: mapAdminRow(sess.admin),
            mfaVerified: Boolean(sess.mfaVerified),
          };
        });
        if (result) {
          await platformCache.setCachedAdminSession(tokenHash, result.admin, result.mfaVerified);
        }
        return result;
      } catch {
        return null;
      }
    }

    const sess = Object.values(memoryAdminSessions).find(
      (s) => s.tokenHash === tokenHash && !s.revokedAt && s.expiresAt.getTime() > now.getTime(),
    );
    if (!sess) return null;
    const admin = memoryAdmins[sess.adminId];
    if (!admin || admin.status !== "ACTIVE") return null;
    const result = {
      admin: toSafeMemoryAdmin(admin),
      mfaVerified: sess.mfaVerified,
    };
    await platformCache.setCachedAdminSession(tokenHash, result.admin, result.mfaVerified);
    return result;
  },

  async verifyToken(token: string): Promise<PlatformAdminRecord | null> {
    const sess = await this.verifySessionToken(token);
    if (!sess) return null;
    if (!isPlatformAdminFullyVerified(sess.admin, sess.mfaVerified)) {
      return null;
    }
    return sess.admin;
  },

  async getSessionFromRequest(req: NextRequest): Promise<PlatformSessionContext | null> {
    const token = req.cookies.get(getPlatformAdminCookieName())?.value;
    if (!token) return null;
    const verified = await this.verifySessionToken(token);
    if (!verified) return null;
    return { ...verified, token };
  },

  async getAdminFromRequest(req: NextRequest): Promise<PlatformAdminRecord | null> {
    const session = await this.getSessionFromRequest(req);
    if (!session) return null;
    if (!isPlatformAdminFullyVerified(session.admin, session.mfaVerified)) {
      return null;
    }
    return session.admin;
  },

  async revokeToken(token?: string | null): Promise<void> {
    if (!token) return;
    const tokenHash = hashSessionToken(token);
    await platformCache.deleteCachedAdminSession(tokenHash);
    const now = new Date();
    if (await authRepository.canUsePrismaForPlatform()) {
      try {
        await runAdminTx(async (tx) => {
          const status = await getPlatformSchemaStatus(tx);
          if (!status.hasAdmins) return;
          await (tx as any).platformAdminSession.updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: now },
          });
        });
      } catch {
        // ignore
      }
      return;
    }
    for (const s of Object.values(memoryAdminSessions)) {
      if (s.tokenHash === tokenHash) s.revokedAt = now;
    }
  },

  async changeInitialPassword(
    adminId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<PlatformAdminRecord> {
    const now = new Date();
    const newHash = await hashPassword(newPassword);

    if (await authRepository.canUsePrismaForPlatform()) {
      return runAdminTx(async (tx) => {
        await assertPlatformMfaSchema(tx);
        const row = await (tx as any).platformAdmin.findUnique({
          where: { id: adminId },
          include: { _count: { select: { passkeys: true } } },
        });
        if (!row || row.status !== "ACTIVE") {
          throw new NotFoundError("Company Admin");
        }
        const matchesCurrent = await verifyPassword(currentPassword, row.passwordHash);
        if (!matchesCurrent) {
          throw new ValidationError("Current password is incorrect.");
        }
        const reusedSame = await verifyPassword(newPassword, row.passwordHash);
        if (reusedSame) {
          throw new ValidationError("New password must be different from your current password.");
        }

        const updated = await (tx as any).platformAdmin.update({
          where: { id: adminId },
          data: {
            passwordHash: newHash,
            mustChangePassword: false,
            passwordChangedAt: now,
          },
          include: {
            passkeys: { orderBy: { createdAt: "desc" } },
            _count: { select: { passkeys: true } },
          },
        });
        return mapAdminRow(updated);
      }).then(async (admin) => {
        await platformCache.bumpAdminVersion(adminId);
        return admin;
      });
    }

    const admin = memoryAdmins[adminId];
    if (!admin || admin.status !== "ACTIVE") throw new NotFoundError("Company Admin");
    const matchesCurrent = await verifyPassword(currentPassword, admin.passwordHash);
    if (!matchesCurrent) {
      throw new ValidationError("Current password is incorrect.");
    }
    const reusedSame = await verifyPassword(newPassword, admin.passwordHash);
    if (reusedSame) {
      throw new ValidationError("New password must be different from your current password.");
    }
    admin.passwordHash = newHash;
    admin.mustChangePassword = false;
    admin.passwordChangedAt = now.toISOString();
    await platformCache.bumpAdminVersion(adminId);
    return toSafeMemoryAdmin(admin);
  },

  async setUnverifiedPhone(
    adminId: string,
    normalizedPhone: string,
  ): Promise<PlatformAdminRecord> {
    if (await authRepository.canUsePrismaForPlatform()) {
      return runAdminTx(async (tx) => {
        await assertPlatformMfaSchema(tx);
        const existing = await (tx as any).platformAdmin.findUnique({
          where: { id: adminId },
          include: {
            passkeys: { orderBy: { createdAt: "desc" } },
            _count: { select: { passkeys: true } },
          },
        });
        if (!existing || existing.status !== "ACTIVE") {
          throw new NotFoundError("Company Admin");
        }
        if (existing.phoneVerifiedAt && existing.phone === normalizedPhone) {
          throw new ValidationError("This phone number is already verified.");
        }
        if (existing.phoneVerifiedAt) {
          throw new ValidationError("Phone number is already verified and locked.");
        }
        const updated = await (tx as any).platformAdmin.update({
          where: { id: adminId },
          data: { phone: normalizedPhone },
          include: {
            passkeys: { orderBy: { createdAt: "desc" } },
            _count: { select: { passkeys: true } },
          },
        });
        return mapAdminRow(updated);
      }).then(async (admin) => {
        await platformCache.bumpAdminVersion(adminId);
        return admin;
      });
    }

    const admin = memoryAdmins[adminId];
    if (!admin || admin.status !== "ACTIVE") throw new NotFoundError("Company Admin");
    if (admin.phoneVerifiedAt) {
      throw new ValidationError("Phone number is already verified.");
    }
    admin.phone = normalizedPhone;
    await platformCache.bumpAdminVersion(adminId);
    return toSafeMemoryAdmin(admin);
  },

  async markContactVerified(
    adminId: string,
    channel: "EMAIL" | "SMS",
    verifiedPhone?: string,
  ): Promise<PlatformAdminRecord> {
    const now = new Date();
    if (await authRepository.canUsePrismaForPlatform()) {
      return runAdminTx(async (tx) => {
        await assertPlatformMfaSchema(tx);
        const existing = await (tx as any).platformAdmin.findUnique({
          where: { id: adminId },
          select: { id: true, status: true },
        });
        if (!existing || existing.status !== "ACTIVE") {
          throw new NotFoundError("Company Admin");
        }
        const data: Record<string, unknown> =
          channel === "EMAIL"
            ? { emailVerifiedAt: now }
            : { phoneVerifiedAt: now, ...(verifiedPhone ? { phone: verifiedPhone } : {}) };
        const updated = await (tx as any).platformAdmin.update({
          where: { id: adminId },
          data,
          include: {
            passkeys: { orderBy: { createdAt: "desc" } },
            _count: { select: { passkeys: true } },
          },
        });
        return mapAdminRow(updated);
      }).then(async (admin) => {
        await platformCache.bumpAdminVersion(adminId);
        return admin;
      });
    }

    const admin = memoryAdmins[adminId];
    if (!admin || admin.status !== "ACTIVE") throw new NotFoundError("Company Admin");
    if (channel === "EMAIL") {
      admin.emailVerifiedAt = now.toISOString();
    } else {
      admin.phoneVerifiedAt = now.toISOString();
      if (verifiedPhone) admin.phone = verifiedPhone;
    }
    await platformCache.bumpAdminVersion(adminId);
    return toSafeMemoryAdmin(admin);
  },

  async beginTotpSetup(
    adminId: string,
  ): Promise<{ secret: string; otpauthUri: string }> {
    let email = "";
    if (await authRepository.canUsePrismaForPlatform()) {
      const row = await runAdminTx(async (tx) => {
        await assertPlatformMfaSchema(tx);
        return (tx as any).platformAdmin.findUnique({
          where: { id: adminId },
          select: {
            id: true,
            email: true,
            status: true,
            mustChangePassword: true,
            emailVerifiedAt: true,
            phoneVerifiedAt: true,
          },
        });
      });
      if (!row || row.status !== "ACTIVE") throw new NotFoundError("Company Admin");
      if (row.mustChangePassword) {
        throw new ValidationError("Change your initial password before enrolling 2FA.");
      }
      if (!row.emailVerifiedAt || !row.phoneVerifiedAt) {
        throw new ValidationError("Verify both email and phone number before enrolling 2FA.");
      }
      email = row.email;
    } else {
      const admin = memoryAdmins[adminId];
      if (!admin || admin.status !== "ACTIVE") throw new NotFoundError("Company Admin");
      if (admin.mustChangePassword) {
        throw new ValidationError("Change your initial password before enrolling 2FA.");
      }
      if (!admin.emailVerifiedAt || !admin.phoneVerifiedAt) {
        throw new ValidationError("Verify both email and phone number before enrolling 2FA.");
      }
      email = admin.email;
    }

    const secret = generateBase32Secret(20);
    return {
      secret,
      otpauthUri: buildOtpAuthUri(email, secret),
    };
  },

  async confirmTotpSetup(
    adminId: string,
    sessionToken: string,
    base32Secret: string,
    code: string,
  ): Promise<{ admin: PlatformAdminRecord; recoveryCodes: string[] }> {
    if (!verifyTotpCode(base32Secret, code)) {
      throw new ValidationError(
        "Invalid 6-digit authenticator code. Verify your authenticator clock and try again.",
      );
    }

    const secretEnc = encryptTotpSecret(base32Secret);
    const { plaintextCodes, hashes } = generateRecoveryCodes(8);
    const tokenHash = hashSessionToken(sessionToken);

    if (await authRepository.canUsePrismaForPlatform()) {
      const admin = await runAdminTx(async (tx) => {
        await assertPlatformMfaSchema(tx);
        const existing = await (tx as any).platformAdmin.findUnique({
          where: { id: adminId },
          select: {
            id: true,
            status: true,
            mustChangePassword: true,
            emailVerifiedAt: true,
            phoneVerifiedAt: true,
          },
        });
        if (!existing || existing.status !== "ACTIVE") throw new NotFoundError("Company Admin");
        if (existing.mustChangePassword) {
          throw new ValidationError("Change your initial password before enrolling 2FA.");
        }
        if (!existing.emailVerifiedAt || !existing.phoneVerifiedAt) {
          throw new ValidationError("Verify both email and phone number before enrolling 2FA.");
        }

        const updated = await (tx as any).platformAdmin.update({
          where: { id: adminId },
          data: {
            twoFactorEnabled: true,
            totpSecretEnc: secretEnc,
            recoveryCodeHashes: hashes,
          },
          include: {
            passkeys: { orderBy: { createdAt: "desc" } },
            _count: { select: { passkeys: true } },
          },
        });
        await (tx as any).platformAdminSession.updateMany({
          where: { adminId, tokenHash, revokedAt: null },
          data: { mfaVerified: true },
        });
        return mapAdminRow(updated);
      });
      await Promise.all([
        platformCache.bumpAdminVersion(adminId),
        platformCache.deleteCachedAdminSession(tokenHash),
      ]);
      return { admin, recoveryCodes: plaintextCodes };
    }

    const admin = memoryAdmins[adminId];
    if (!admin || admin.status !== "ACTIVE") throw new NotFoundError("Company Admin");
    if (admin.mustChangePassword) {
      throw new ValidationError("Change your initial password before enrolling 2FA.");
    }
    if (!admin.emailVerifiedAt || !admin.phoneVerifiedAt) {
      throw new ValidationError("Verify both email and phone number before enrolling 2FA.");
    }
    admin.twoFactorEnabled = true;
    admin.totpSecretEnc = secretEnc;
    admin.recoveryCodeHashes = hashes;
    for (const s of Object.values(memoryAdminSessions)) {
      if (s.adminId === adminId && s.tokenHash === tokenHash && !s.revokedAt) {
        s.mfaVerified = true;
      }
    }
    await Promise.all([
      platformCache.bumpAdminVersion(adminId),
      platformCache.deleteCachedAdminSession(tokenHash),
    ]);
    return { admin: toSafeMemoryAdmin(admin), recoveryCodes: plaintextCodes };
  },

  async verifyTotpOrRecoveryAndMarkSession(
    adminId: string,
    sessionToken: string,
    codeInput: string,
  ): Promise<{
    admin: PlatformAdminRecord;
    usedRecoveryCode: boolean;
    remainingRecoveryCodes: number;
  }> {
    const tokenHash = hashSessionToken(sessionToken);

    if (await authRepository.canUsePrismaForPlatform()) {
      return runAdminTx(async (tx) => {
        await assertPlatformMfaSchema(tx);
        const row = await (tx as any).platformAdmin.findUnique({
          where: { id: adminId },
          include: {
            passkeys: { orderBy: { createdAt: "desc" } },
            _count: { select: { passkeys: true } },
          },
        });
        if (!row || row.status !== "ACTIVE") throw new NotFoundError("Company Admin");
        if (!row.twoFactorEnabled || !row.totpSecretEnc) {
          throw new ValidationError("Authenticator 2FA is not enrolled for this admin.");
        }

        const hashes: string[] = Array.isArray(row.recoveryCodeHashes)
          ? row.recoveryCodeHashes.filter((v: unknown): v is string => typeof v === "string")
          : [];
        const verification = verifyTotpOrRecoveryInput(row.totpSecretEnc, hashes, codeInput);
        const remainingHashes = verification.remainingHashes;
        const usedRecoveryCode = verification.usedRecoveryCode;

        if (usedRecoveryCode || verification.reencryptedTotpSecretEnc) {
          await (tx as any).platformAdmin.update({
            where: { id: adminId },
            data: {
              ...(usedRecoveryCode ? { recoveryCodeHashes: remainingHashes } : {}),
              ...(verification.reencryptedTotpSecretEnc
                ? { totpSecretEnc: verification.reencryptedTotpSecretEnc }
                : {}),
            },
          });
        }

        await (tx as any).platformAdminSession.updateMany({
          where: { adminId, tokenHash, revokedAt: null },
          data: { mfaVerified: true },
        });

        return {
          admin: mapAdminRow(row),
          usedRecoveryCode,
          remainingRecoveryCodes: remainingHashes.length,
        };
      }).then(async (res) => {
        await Promise.all([
          platformCache.bumpAdminVersion(adminId),
          platformCache.deleteCachedAdminSession(tokenHash),
        ]);
        return res;
      });
    }

    const admin = memoryAdmins[adminId];
    if (!admin || admin.status !== "ACTIVE") throw new NotFoundError("Company Admin");
    if (!admin.twoFactorEnabled || !admin.totpSecretEnc) {
      throw new ValidationError("Authenticator 2FA is not enrolled for this admin.");
    }

    const verification = verifyTotpOrRecoveryInput(
      admin.totpSecretEnc,
      admin.recoveryCodeHashes,
      codeInput,
    );
    const usedRecoveryCode = verification.usedRecoveryCode;
    if (usedRecoveryCode) {
      admin.recoveryCodeHashes = verification.remainingHashes;
    }
    if (verification.reencryptedTotpSecretEnc) {
      admin.totpSecretEnc = verification.reencryptedTotpSecretEnc;
    }

    for (const s of Object.values(memoryAdminSessions)) {
      if (s.adminId === adminId && s.tokenHash === tokenHash && !s.revokedAt) {
        s.mfaVerified = true;
      }
    }

    await Promise.all([
      platformCache.bumpAdminVersion(adminId),
      platformCache.deleteCachedAdminSession(tokenHash),
    ]);

    return {
      admin: toSafeMemoryAdmin(admin),
      usedRecoveryCode,
      remainingRecoveryCodes: admin.recoveryCodeHashes.length,
    };
  },

  async listPasskeyDescriptors(params: {
    adminId?: string;
    email?: string;
  }): Promise<Array<{ id: string; transports?: string[] }>> {
    const cleanEmail = params.email?.trim().toLowerCase();

    if (await authRepository.canUsePrismaForPlatform()) {
      return runAdminTx(async (tx) => {
        const status = await getPlatformSchemaStatus(tx);
        if (!status.hasMfaSchema) return [];
        let targetAdminId = params.adminId;
        if (!targetAdminId && cleanEmail) {
          const found = await (tx as any).platformAdmin.findUnique({
            where: { email: cleanEmail },
            select: { id: true, status: true },
          });
          if (!found || found.status !== "ACTIVE") return [];
          targetAdminId = found.id;
        }
        if (!targetAdminId) return [];
        const rows = await (tx as any).platformAdminPasskey.findMany({
          where: { adminId: targetAdminId },
          select: { credentialId: true },
        });
        return (rows as Array<{ credentialId: string }>).map((r) => ({
          id: r.credentialId,
          transports: ["internal", "hybrid", "usb"],
        }));
      });
    }

    let targetAdminId = params.adminId;
    if (!targetAdminId && cleanEmail) {
      const found = Object.values(memoryAdmins).find(
        (a) => a.email.toLowerCase() === cleanEmail && a.status === "ACTIVE",
      );
      if (!found) return [];
      targetAdminId = found.id;
    }
    if (!targetAdminId) return [];
    return Object.values(memoryPasskeys)
      .filter((pk) => pk.adminId === targetAdminId)
      .map((pk) => ({
        id: pk.credentialId,
        transports: ["internal", "hybrid", "usb"],
      }));
  },

  async listPasskeys(adminId: string): Promise<PlatformAdminPasskeyRecord[]> {
    if (await authRepository.canUsePrismaForPlatform()) {
      return runAdminTx(async (tx) => {
        await assertPlatformMfaSchema(tx);
        const rows = await (tx as any).platformAdminPasskey.findMany({
          where: { adminId },
          orderBy: { createdAt: "desc" },
        });
        return (rows as any[]).map(mapPasskeyRow);
      });
    }
    return Object.values(memoryPasskeys)
      .filter((pk) => pk.adminId === adminId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(mapPasskeyRow);
  },

  async registerPasskey(
    adminId: string,
    sessionToken: string,
    input: {
      challengeToken: string;
      credentialId: string;
      publicKeySpki: string;
      algorithm: number;
      deviceName: string;
      clientDataJSON: string;
    },
    expectedOrigins: string[],
  ): Promise<{ passkey: PlatformAdminPasskeyRecord; admin: PlatformAdminRecord }> {
    const challengePayload = await verifyWebAuthnChallengeToken(
      input.challengeToken,
      "register",
    );
    if (!challengePayload.adminId || challengePayload.adminId !== adminId) {
      throw new ValidationError("Passkey challenge does not match this Company Admin.");
    }

    const clientCheck = verifyPasskeyRegistrationClientData({
      clientDataJSONBase64Url: input.clientDataJSON,
      expectedChallenge: challengePayload.challenge,
      expectedOrigins,
    });
    if (!clientCheck.valid) {
      throw new ValidationError(clientCheck.reason || "Invalid passkey registration proof.");
    }

    const tokenHash = hashSessionToken(sessionToken);

    if (await authRepository.canUsePrismaForPlatform()) {
      return runAdminTx(async (tx) => {
        await assertPlatformMfaSchema(tx);
        const adminRow = await (tx as any).platformAdmin.findUnique({
          where: { id: adminId },
          select: {
            id: true,
            status: true,
            mustChangePassword: true,
            emailVerifiedAt: true,
            phoneVerifiedAt: true,
          },
        });
        if (!adminRow || adminRow.status !== "ACTIVE") {
          throw new NotFoundError("Company Admin");
        }
        if (adminRow.mustChangePassword) {
          throw new ValidationError("Change your initial password before registering a passkey.");
        }
        if (!adminRow.emailVerifiedAt || !adminRow.phoneVerifiedAt) {
          throw new ValidationError(
            "Verify both email and phone number before registering a passkey.",
          );
        }

        const dup = await (tx as any).platformAdminPasskey.findUnique({
          where: { credentialId: input.credentialId },
          select: { id: true },
        });
        if (dup) {
          throw new ConflictError("This passkey credential is already registered.");
        }

        const created = await (tx as any).platformAdminPasskey.create({
          data: {
            adminId,
            credentialId: input.credentialId,
            publicKeySpki: input.publicKeySpki,
            algorithm: input.algorithm,
            deviceName: input.deviceName.trim(),
            counter: 0,
          },
        });

        await (tx as any).platformAdminSession.updateMany({
          where: { adminId, tokenHash, revokedAt: null },
          data: { mfaVerified: true },
        });

        const updatedAdmin = await (tx as any).platformAdmin.findUnique({
          where: { id: adminId },
          include: {
            passkeys: { orderBy: { createdAt: "desc" } },
            _count: { select: { passkeys: true } },
          },
        });

        return {
          passkey: mapPasskeyRow(created),
          admin: mapAdminRow(updatedAdmin),
        };
      }).then(async (res) => {
        await Promise.all([
          platformCache.bumpAdminVersion(adminId),
          platformCache.deleteCachedAdminSession(tokenHash),
        ]);
        return res;
      });
    }

    const admin = memoryAdmins[adminId];
    if (!admin || admin.status !== "ACTIVE") throw new NotFoundError("Company Admin");
    if (admin.mustChangePassword) {
      throw new ValidationError("Change your initial password before registering a passkey.");
    }
    if (!admin.emailVerifiedAt || !admin.phoneVerifiedAt) {
      throw new ValidationError(
        "Verify both email and phone number before registering a passkey.",
      );
    }
    if (Object.values(memoryPasskeys).some((p) => p.credentialId === input.credentialId)) {
      throw new ConflictError("This passkey credential is already registered.");
    }

    const pkId = randomUUID();
    const rec: StoredPlatformAdminPasskey = {
      id: pkId,
      adminId,
      credentialId: input.credentialId,
      publicKeySpki: input.publicKeySpki,
      algorithm: input.algorithm,
      deviceName: input.deviceName.trim(),
      counter: 0,
      lastUsedAt: null,
      createdAt: new Date(),
    };
    memoryPasskeys[pkId] = rec;

    for (const s of Object.values(memoryAdminSessions)) {
      if (s.adminId === adminId && s.tokenHash === tokenHash && !s.revokedAt) {
        s.mfaVerified = true;
      }
    }

    await Promise.all([
      platformCache.bumpAdminVersion(adminId),
      platformCache.deleteCachedAdminSession(tokenHash),
    ]);

    return {
      passkey: mapPasskeyRow(rec),
      admin: toSafeMemoryAdmin(admin),
    };
  },

  async verifyPasskeyAndCreateOrMarkSession(params: {
    challengeToken: string;
    credentialId: string;
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    expectedOrigins: string[];
    expectedRpIds: string[];
    existingSessionToken?: string | null;
    meta?: { ipAddress?: string; userAgent?: string };
  }): Promise<{ admin: PlatformAdminRecord; token: string; expiresAt: Date }> {
    const challengePayload = await verifyWebAuthnChallengeToken(
      params.challengeToken,
      "authenticate",
    );

    const now = new Date();

    if (await authRepository.canUsePrismaForPlatform()) {
      return runAdminTx(async (tx) => {
        await assertPlatformMfaSchema(tx);
        const passkey = await (tx as any).platformAdminPasskey.findUnique({
          where: { credentialId: params.credentialId },
          include: { admin: true },
        });
        if (!passkey || !passkey.admin || passkey.admin.status !== "ACTIVE") {
          throw new ValidationError("Passkey not recognized for an active Company Admin.");
        }
        if (challengePayload.adminId && challengePayload.adminId !== passkey.adminId) {
          throw new ValidationError("Passkey does not belong to the signed-in Company Admin.");
        }

        const assertionCheck = verifyPasskeyAssertion({
          publicKeySpkiBase64Url: passkey.publicKeySpki,
          expectedChallenge: challengePayload.challenge,
          expectedOrigins: params.expectedOrigins,
          expectedRpIds: params.expectedRpIds,
          clientDataJSONBase64Url: params.clientDataJSON,
          authenticatorDataBase64Url: params.authenticatorData,
          signatureBase64Url: params.signature,
          storedCounter: Number(passkey.counter ?? 0),
        });
        if (!assertionCheck.valid) {
          throw new ValidationError(assertionCheck.reason || "Passkey verification failed.");
        }

        await (tx as any).platformAdminPasskey.update({
          where: { id: passkey.id },
          data: {
            counter: assertionCheck.newCounter,
            lastUsedAt: now,
          },
        });
        await (tx as any).platformAdmin.update({
          where: { id: passkey.adminId },
          data: { lastLoginAt: now },
        });

        let sessionToken = params.existingSessionToken || "";
        let expiresAt = new Date(now.getTime() + PLATFORM_SESSION_TTL_SECONDS * 1000);
        let reusedExisting = false;

        if (sessionToken) {
          const existingHash = hashSessionToken(sessionToken);
          const existingSess = await (tx as any).platformAdminSession.findFirst({
            where: {
              adminId: passkey.adminId,
              tokenHash: existingHash,
              revokedAt: null,
              expiresAt: { gt: now },
            },
          });
          if (existingSess) {
            await (tx as any).platformAdminSession.update({
              where: { id: existingSess.id },
              data: { mfaVerified: true },
            });
            expiresAt = new Date(existingSess.expiresAt);
            reusedExisting = true;
          }
        }

        if (!reusedExisting) {
          sessionToken = randomBytes(32).toString("hex");
          await (tx as any).platformAdminSession.create({
            data: {
              adminId: passkey.adminId,
              tokenHash: hashSessionToken(sessionToken),
              mfaVerified: true,
              ipAddress: params.meta?.ipAddress?.slice(0, 45) ?? null,
              userAgent: params.meta?.userAgent ?? null,
              expiresAt,
            },
          });
        }

        const refreshedAdmin = await (tx as any).platformAdmin.findUnique({
          where: { id: passkey.adminId },
          include: {
            passkeys: { orderBy: { createdAt: "desc" } },
            _count: { select: { passkeys: true } },
          },
        });

        return {
          admin: mapAdminRow(refreshedAdmin),
          token: sessionToken,
          expiresAt,
        };
      }).then(async (res) => {
        await Promise.all([
          platformCache.bumpAdminVersion(res.admin.id),
          platformCache.deleteCachedAdminSession(hashSessionToken(res.token)),
        ]);
        return res;
      });
    }

    const passkey = Object.values(memoryPasskeys).find(
      (p) => p.credentialId === params.credentialId,
    );
    if (!passkey) {
      throw new ValidationError("Passkey not recognized for an active Company Admin.");
    }
    const admin = memoryAdmins[passkey.adminId];
    if (!admin || admin.status !== "ACTIVE") {
      throw new ValidationError("Passkey not recognized for an active Company Admin.");
    }
    if (challengePayload.adminId && challengePayload.adminId !== admin.id) {
      throw new ValidationError("Passkey does not belong to the signed-in Company Admin.");
    }

    const assertionCheck = verifyPasskeyAssertion({
      publicKeySpkiBase64Url: passkey.publicKeySpki,
      expectedChallenge: challengePayload.challenge,
      expectedOrigins: params.expectedOrigins,
      expectedRpIds: params.expectedRpIds,
      clientDataJSONBase64Url: params.clientDataJSON,
      authenticatorDataBase64Url: params.authenticatorData,
      signatureBase64Url: params.signature,
      storedCounter: passkey.counter,
    });
    if (!assertionCheck.valid) {
      throw new ValidationError(assertionCheck.reason || "Passkey verification failed.");
    }

    passkey.counter = assertionCheck.newCounter;
    passkey.lastUsedAt = now;
    admin.lastLoginAt = now.toISOString();

    let sessionToken = params.existingSessionToken || "";
    let expiresAt = new Date(now.getTime() + PLATFORM_SESSION_TTL_SECONDS * 1000);
    let reusedExisting = false;

    if (sessionToken) {
      const existingHash = hashSessionToken(sessionToken);
      const existingSess = Object.values(memoryAdminSessions).find(
        (s) =>
          s.adminId === admin.id &&
          s.tokenHash === existingHash &&
          !s.revokedAt &&
          s.expiresAt.getTime() > now.getTime(),
      );
      if (existingSess) {
        existingSess.mfaVerified = true;
        expiresAt = existingSess.expiresAt;
        reusedExisting = true;
      }
    }

    if (!reusedExisting) {
      sessionToken = randomBytes(32).toString("hex");
      const sessId = randomUUID();
      memoryAdminSessions[sessId] = {
        id: sessId,
        adminId: admin.id,
        tokenHash: hashSessionToken(sessionToken),
        mfaVerified: true,
        ipAddress: params.meta?.ipAddress ?? null,
        userAgent: params.meta?.userAgent ?? null,
        expiresAt,
        revokedAt: null,
      };
    }

    await Promise.all([
      platformCache.bumpAdminVersion(admin.id),
      platformCache.deleteCachedAdminSession(hashSessionToken(sessionToken)),
    ]);

    return {
      admin: toSafeMemoryAdmin(admin),
      token: sessionToken,
      expiresAt,
    };
  },

  async deletePasskey(adminId: string, passkeyId: string): Promise<void> {
    if (await authRepository.canUsePrismaForPlatform()) {
      await runAdminTx(async (tx) => {
        await assertPlatformMfaSchema(tx);
        const admin = await (tx as any).platformAdmin.findUnique({
          where: { id: adminId },
          include: { _count: { select: { passkeys: true } } },
        });
        if (!admin) throw new NotFoundError("Company Admin");
        const target = await (tx as any).platformAdminPasskey.findFirst({
          where: { id: passkeyId, adminId },
        });
        if (!target) throw new NotFoundError("Passkey");
        if (!admin.twoFactorEnabled && (admin._count?.passkeys ?? 0) <= 1) {
          throw new ValidationError(
            "Cannot remove your last MFA method. Enable Authenticator 2FA or add another passkey first.",
          );
        }
        await (tx as any).platformAdminPasskey.delete({ where: { id: passkeyId } });
      });
      await platformCache.bumpAdminVersion(adminId);
      return;
    }

    const admin = memoryAdmins[adminId];
    if (!admin) throw new NotFoundError("Company Admin");
    const pk = memoryPasskeys[passkeyId];
    if (!pk || pk.adminId !== adminId) throw new NotFoundError("Passkey");
    const count = Object.values(memoryPasskeys).filter((p) => p.adminId === adminId).length;
    if (!admin.twoFactorEnabled && count <= 1) {
      throw new ValidationError(
        "Cannot remove your last MFA method. Enable Authenticator 2FA or add another passkey first.",
      );
    }
    delete memoryPasskeys[passkeyId];
    await platformCache.bumpAdminVersion(adminId);
  },

  async listAdmins(): Promise<PlatformAdminRecord[]> {
    return platformCache.getOrLoadAdminsList(async () => {
      if (await authRepository.canUsePrismaForPlatform()) {
        return runAdminTx(async (tx) => {
          const status = await getPlatformSchemaStatus(tx);
          if (!status.hasAdmins) return [];
          const rows = await (tx as any).platformAdmin.findMany({
            orderBy: { createdAt: "asc" },
            include: {
              _count: {
                select: {
                  sessions: { where: { revokedAt: null, expiresAt: { gt: new Date() } } },
                  ...(status.hasMfaSchema ? { passkeys: true } : {}),
                },
              },
            },
          });
          return (rows as any[]).map(mapAdminRow);
        });
      }

      const now = Date.now();
      return Object.values(memoryAdmins)
        .map((a) => ({
          ...toSafeMemoryAdmin(a),
          activeSessionCount: Object.values(memoryAdminSessions).filter(
            (s) => s.adminId === a.id && !s.revokedAt && s.expiresAt.getTime() > now,
          ).length,
        }))
        .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    });
  },

  async createAdmin(
    creatorAdminId: string,
    input: CreatePlatformAdminInput,
  ): Promise<PlatformAdminRecord> {
    const cleanEmail = input.email.trim().toLowerCase();
    const passwordHash = await hashPassword(input.password);
    const now = new Date();

    if (await authRepository.canUsePrismaForPlatform()) {
      return runAdminTx(async (tx) => {
        await assertPlatformMfaSchema(tx);
        const existing = await (tx as any).platformAdmin.findUnique({
          where: { email: cleanEmail },
          select: { id: true },
        });
        if (existing) {
          throw new ConflictError("A Company Admin with this email already exists.");
        }
        const created = await (tx as any).platformAdmin.create({
          data: {
            name: input.name.trim(),
            email: cleanEmail,
            phone: input.phone?.trim() || null,
            passwordHash,
            role: input.role ?? "OPERATIONS",
            status: "ACTIVE",
            department: input.department?.trim() || null,
            mustChangePassword: true,
            emailVerifiedAt: null,
            phoneVerifiedAt: null,
            twoFactorEnabled: false,
            createdByAdminId: UUID_REGEX.test(creatorAdminId) ? creatorAdminId : null,
          },
        });
        return mapAdminRow(created);
      }).then(async (rec) => {
        await platformCache.bumpAdminsListVersion();
        return rec;
      });
    }

    const dup = Object.values(memoryAdmins).some(
      (a) => a.email.toLowerCase() === cleanEmail,
    );
    if (dup) {
      throw new ConflictError("A Company Admin with this email already exists.");
    }
    const id = randomUUID();
    const rec: StoredPlatformAdmin = {
      id,
      name: input.name.trim(),
      email: cleanEmail,
      phone: input.phone?.trim() || null,
      passwordHash,
      role: (input.role ?? "OPERATIONS") as PlatformAdminRoleValue,
      status: "ACTIVE",
      department: input.department?.trim() || null,
      lastLoginAt: null,
      createdByAdminId: UUID_REGEX.test(creatorAdminId) ? creatorAdminId : null,
      mustChangePassword: true,
      passwordChangedAt: null,
      emailVerifiedAt: null,
      phoneVerifiedAt: null,
      twoFactorEnabled: false,
      totpSecretEnc: null,
      recoveryCodeHashes: [],
      createdAt: now.toISOString(),
    };
    memoryAdmins[id] = rec;
    await platformCache.bumpAdminsListVersion();
    return toSafeMemoryAdmin(rec);
  },

  async updateAdmin(
    actorAdminId: string,
    input: UpdatePlatformAdminInput,
  ): Promise<PlatformAdminRecord> {
    if (
      actorAdminId === input.adminId &&
      (input.status === "SUSPENDED" || input.status === "INACTIVE")
    ) {
      throw new ValidationError("You cannot suspend or deactivate your own Company Admin account.");
    }
    if (actorAdminId === input.adminId && input.role && input.role !== "SUPER_ADMIN") {
      throw new ValidationError("You cannot downgrade your own SUPER_ADMIN role.");
    }

    if (await authRepository.canUsePrismaForPlatform()) {
      return runAdminTx(async (tx) => {
        await assertPlatformMfaSchema(tx);
        const existing = await (tx as any).platformAdmin.findUnique({
          where: { id: input.adminId },
        });
        if (!existing) throw new NotFoundError("Company Admin");

        const data: Record<string, unknown> = {};
        if (input.name !== undefined) data.name = input.name.trim();
        let phoneChanged = false;
        if (input.phone !== undefined) {
          const cleanPhone = input.phone?.trim() || null;
          data.phone = cleanPhone;
          if (cleanPhone !== existing.phone) {
            data.phoneVerifiedAt = null;
            phoneChanged = true;
          }
        }
        if (input.role !== undefined) data.role = input.role;
        if (input.status !== undefined) data.status = input.status;
        if (input.department !== undefined) data.department = input.department?.trim() || null;
        if (input.newPassword) {
          data.passwordHash = await hashPassword(input.newPassword);
          data.mustChangePassword = true;
        } else if (input.forcePasswordReset) {
          data.mustChangePassword = true;
        }
        if (input.resetMfa) {
          data.twoFactorEnabled = false;
          data.totpSecretEnc = null;
          data.recoveryCodeHashes = null;
          await (tx as any).platformAdminPasskey.deleteMany({
            where: { adminId: input.adminId },
          });
        }

        const updated = await (tx as any).platformAdmin.update({
          where: { id: input.adminId },
          data,
          include: {
            _count: { select: { passkeys: true } },
          },
        });

        if (
          input.revokeSessions ||
          phoneChanged ||
          input.newPassword ||
          input.forcePasswordReset ||
          input.resetMfa ||
          input.status === "SUSPENDED" ||
          input.status === "INACTIVE"
        ) {
          await (tx as any).platformAdminSession.updateMany({
            where: { adminId: input.adminId, revokedAt: null },
            data: { revokedAt: new Date() },
          });
        }
        return mapAdminRow(updated);
      }).then(async (admin) => {
        await platformCache.bumpAdminVersion(input.adminId);
        return admin;
      });
    }

    const admin = memoryAdmins[input.adminId];
    if (!admin) throw new NotFoundError("Company Admin");
    if (input.name !== undefined) admin.name = input.name.trim();
    let phoneChanged = false;
    if (input.phone !== undefined) {
      const cleanPhone = input.phone?.trim() || null;
      if (cleanPhone !== admin.phone) {
        admin.phone = cleanPhone;
        admin.phoneVerifiedAt = null;
        phoneChanged = true;
      }
    }
    if (input.role !== undefined) admin.role = input.role;
    if (input.status !== undefined) admin.status = input.status;
    if (input.department !== undefined) admin.department = input.department?.trim() || null;
    if (input.newPassword) {
      admin.passwordHash = await hashPassword(input.newPassword);
      admin.mustChangePassword = true;
    } else if (input.forcePasswordReset) {
      admin.mustChangePassword = true;
    }
    if (input.resetMfa) {
      admin.twoFactorEnabled = false;
      admin.totpSecretEnc = null;
      admin.recoveryCodeHashes = [];
      for (const [pkId, pk] of Object.entries(memoryPasskeys)) {
        if (pk.adminId === input.adminId) delete memoryPasskeys[pkId];
      }
    }

    if (
      input.revokeSessions ||
      phoneChanged ||
      input.newPassword ||
      input.forcePasswordReset ||
      input.resetMfa ||
      input.status === "SUSPENDED" ||
      input.status === "INACTIVE"
    ) {
      const now = new Date();
      for (const s of Object.values(memoryAdminSessions)) {
        if (s.adminId === input.adminId && !s.revokedAt) s.revokedAt = now;
      }
    }
    await platformCache.bumpAdminVersion(input.adminId);
    return toSafeMemoryAdmin(admin);
  },

  async deleteAdmin(actorAdminId: string, targetAdminId: string): Promise<void> {
    if (actorAdminId === targetAdminId) {
      throw new ValidationError("You cannot delete your own Company Admin account.");
    }
    if (await authRepository.canUsePrismaForPlatform()) {
      await runAdminTx(async (tx) => {
        const status = await getPlatformSchemaStatus(tx);
        if (!status.hasAdmins) return;
        const existing = await (tx as any).platformAdmin.findUnique({
          where: { id: targetAdminId },
          select: { id: true },
        });
        if (!existing) throw new NotFoundError("Company Admin");
        await (tx as any).platformAdmin.delete({ where: { id: targetAdminId } });
      });
      await platformCache.bumpAdminVersion(targetAdminId);
      return;
    }
    if (!memoryAdmins[targetAdminId]) throw new NotFoundError("Company Admin");
    delete memoryAdmins[targetAdminId];
    for (const [sid, s] of Object.entries(memoryAdminSessions)) {
      if (s.adminId === targetAdminId) delete memoryAdminSessions[sid];
    }
    for (const [pkId, pk] of Object.entries(memoryPasskeys)) {
      if (pk.adminId === targetAdminId) delete memoryPasskeys[pkId];
    }
    await platformCache.bumpAdminVersion(targetAdminId);
  },
};
