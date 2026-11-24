/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import fs from "fs";
import path from "path";
import { db } from "@/server/database/client";
import { normalizePhone, generateSecureToken } from "@/server/security/crypto";

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
 * Checks if Prisma is connected and healthy.
 */
let prismaAvailable: boolean | null = null;
async function isPrismaWorking(): Promise<boolean> {
  if (prismaAvailable !== null) return prismaAvailable;
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database connection timeout")), 1500),
    );
    await Promise.race([db.$queryRaw`SELECT 1`, timeoutPromise]);
    prismaAvailable = true;
    return true;
  } catch {
    prismaAvailable = false;
    console.info("[AuthRepository] PostgreSQL unreachable, operating with resilient persistent store.");
    return false;
  }
}

export const authRepository = {
  // ----------------------------------------------------
  // OTP METHODS
  // ----------------------------------------------------

  async saveOtp(record: Omit<OtpRecord, "id" | "createdAt">): Promise<OtpRecord> {
    const id = `otp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const fullRecord: OtpRecord = {
      ...record,
      id,
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
            metadata: record.verificationToken ? { token: record.verificationToken } : undefined,
          },
        });
        return {
          id: created.id,
          identifier: created.identifier,
          channel: created.channel,
          purpose: created.purpose,
          codeHash: created.codeHash,
          attempts: created.attempts,
          maxAttempts: created.maxAttempts,
          expiresAt: created.expiresAt,
          resendAfter: created.resendAfter,
          verifiedAt: created.verifiedAt,
          verificationToken: (created.metadata as any)?.token || null,
          createdAt: created.createdAt,
        };
      } catch {
        console.warn("[AuthRepository] Prisma saveOtp failed, falling back to store");
      }
    }

    storeMemory.otps[id] = fullRecord;
    saveStore(storeMemory);
    return fullRecord;
  },

  async findActiveOtp(
    identifier: string,
    channel: "EMAIL" | "SMS",
    purpose: "REGISTRATION" | "LOGIN" | "PASSWORD_RESET",
  ): Promise<OtpRecord | null> {
    const now = new Date();

    if (await isPrismaWorking()) {
      try {
        const record = await (db as any).otpVerification.findFirst({
          where: {
            identifier,
            channel,
            purpose,
            verifiedAt: null,
            expiresAt: { gt: now },
          },
          orderBy: { createdAt: "desc" },
        });
        if (record) {
          return {
            id: record.id,
            identifier: record.identifier,
            channel: record.channel,
            purpose: record.purpose,
            codeHash: record.codeHash,
            attempts: record.attempts,
            maxAttempts: record.maxAttempts,
            expiresAt: record.expiresAt,
            resendAfter: record.resendAfter,
            verifiedAt: record.verifiedAt,
            verificationToken: (record.metadata as any)?.token || null,
            createdAt: record.createdAt,
          };
        }
        return null;
      } catch {
        console.warn("[AuthRepository] Prisma findActiveOtp failed, falling back to store");
      }
    }

    // Fallback store
    const normalizedIdentifier =
      channel === "SMS" ? normalizePhone(identifier) : identifier.trim().toLowerCase();

    const matchesFilter = (otps: Record<string, OtpRecord>) =>
      Object.values(otps).filter(
        (o) =>
          (o.identifier === identifier ||
            (channel === "SMS" && normalizePhone(o.identifier) === normalizedIdentifier) ||
            (channel === "EMAIL" && o.identifier.trim().toLowerCase() === normalizedIdentifier)) &&
          o.channel === channel &&
          o.purpose === purpose &&
          !o.verifiedAt &&
          new Date(o.expiresAt).getTime() > now.getTime(),
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
    if (await isPrismaWorking()) {
      try {
        const record = await (db as any).otpVerification.findFirst({
          where: {
            metadata: {
              path: ["token"],
              equals: token,
            },
          },
        });
        if (record) {
          return {
            id: record.id,
            identifier: record.identifier,
            channel: record.channel,
            purpose: record.purpose,
            codeHash: record.codeHash,
            attempts: record.attempts,
            maxAttempts: record.maxAttempts,
            expiresAt: record.expiresAt,
            resendAfter: record.resendAfter,
            verifiedAt: record.verifiedAt,
            verificationToken: token,
            createdAt: record.createdAt,
          };
        }
      } catch {
        // Fallback
      }
    }

    let found = Object.values(storeMemory.otps).find((o) => o.verificationToken === token);
    if (!found) {
      storeMemory = loadStore();
      found = Object.values(storeMemory.otps).find((o) => o.verificationToken === token);
    }
    return found || null;
  },

  async incrementOtpAttempts(id: string): Promise<number> {
    if (await isPrismaWorking()) {
      try {
        const updated = await (db as any).otpVerification.update({
          where: { id },
          data: { attempts: { increment: 1 } },
        });
        return updated.attempts;
      } catch {
        // Fallback
      }
    }

    const otp = storeMemory.otps[id];
    if (otp) {
      otp.attempts += 1;
      saveStore(storeMemory);
      return otp.attempts;
    }
    return 1;
  },

  async markOtpVerified(id: string, token: string): Promise<void> {
    const verifiedAt = new Date();

    if (await isPrismaWorking()) {
      try {
        await (db as any).otpVerification.update({
          where: { id },
          data: {
            verifiedAt,
            metadata: { token },
          },
        });
        return;
      } catch {
        // Fallback
      }
    }

    const otp = storeMemory.otps[id];
    if (otp) {
      otp.verifiedAt = verifiedAt;
      otp.verificationToken = token;
      saveStore(storeMemory);
    }
  },

  async invalidatePreviousOtps(
    identifier: string,
    channel: "EMAIL" | "SMS",
    purpose: "REGISTRATION" | "LOGIN" | "PASSWORD_RESET",
  ): Promise<void> {
    const now = new Date();

    if (await isPrismaWorking()) {
      try {
        await (db as any).otpVerification.updateMany({
          where: {
            identifier,
            channel,
            purpose,
            verifiedAt: null,
          },
          data: {
            expiresAt: now,
          },
        });
        return;
      } catch {
        // Fallback
      }
    }

    for (const otp of Object.values(storeMemory.otps)) {
      if (
        otp.identifier === identifier &&
        otp.channel === channel &&
        otp.purpose === purpose &&
        !otp.verifiedAt
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
        if (user) return user as unknown as UserRecord;
      } catch {
        // Fallback
      }
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
    const schoolId = `sch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
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
        const createdSchool = await (db as any).school.create({
          data: {
            id: schoolId,
            name: schoolRecord.name,
            slug: schoolRecord.slug,
            code: schoolRecord.code,
            category: schoolRecord.category,
            affiliationBoard: schoolRecord.affiliationBoard,
            contactPhone: schoolRecord.contactPhone,
            website: schoolRecord.website,
            addressLine: schoolRecord.addressLine || "",
            city: schoolRecord.city || "",
            state: schoolRecord.state || "",
            pinCode: schoolRecord.pinCode || "",
            country: schoolRecord.country,
            status: "TRIAL",
          },
        });

        const createdUser = await (db as any).user.create({
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

        return {
          user: { ...(createdUser as unknown as UserRecord), school: createdSchool as any },
          school: createdSchool as unknown as SchoolRecord,
        };
      } catch {
        console.warn("[AuthRepository] Prisma create school/user failed, storing locally");
      }
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
    const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
        return created as unknown as SessionRecord;
      } catch {
        // Fallback
      }
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
