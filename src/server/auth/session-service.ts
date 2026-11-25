import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { generateSecureToken, hashToken } from "@/server/security/crypto";
import { systemCache } from "@/server/integrations/redis";
import { authRepository, UserRecord, SchoolRecord } from "./auth-repository";

const parsedSessionTtl = Number.parseInt(process.env.AUTH_SESSION_TTL_SECONDS || "", 10);
const SESSION_TTL_SECONDS =
  Number.isFinite(parsedSessionTtl) && parsedSessionTtl > 0 ? parsedSessionTtl : 2592000; // 30 days default
const SESSION_CACHE_TTL_SECONDS = 120;

interface CachedSessionPayload {
  sessionId: string;
  expiresAtMs: number;
  user: Omit<UserRecord, "passwordHash">;
  school: SchoolRecord | null;
}

function sessionCacheKey(tokenHash: string): string {
  return `session:${tokenHash}`;
}

export function getSessionCookieName(): string {
  // In HTTPS/production, __Host- prefix ensures secure-only, domain-locked cookie
  if (process.env.NODE_ENV === "production") {
    return process.env.AUTH_COOKIE_NAME || "__Host-school_session";
  }
  return "scholonix_session";
}

export interface SessionContext {
  user: UserRecord;
  school: SchoolRecord | null;
  sessionId: string;
}

export const sessionService = {
  /**
   * Creates a new session for a user and returns the raw opaque session token.
   */
  async createSession(
    user: UserRecord,
    meta?: { ipAddress?: string | null; userAgent?: string | null },
  ): Promise<{ token: string; expiresAt: Date; cookieName: string }> {
    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

    await authRepository.createSession({
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return {
      token: rawToken,
      expiresAt,
      cookieName: getSessionCookieName(),
    };
  },

  /**
   * Sets the session cookie on a NextResponse object.
   */
  setSessionCookie(
    response: NextResponse,
    token: string,
    expiresAt: Date,
  ): void {
    const cookieName = getSessionCookieName();
    const isProd = process.env.NODE_ENV === "production";

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
      maxAge: SESSION_TTL_SECONDS,
    });
  },

  /**
   * Clears the session cookie on a NextResponse object.
   */
  clearSessionCookie(response: NextResponse): void {
    const cookieName = getSessionCookieName();
    response.cookies.set(cookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  },

  /**
   * Retrieves and verifies the session from the incoming NextRequest.
   */
  async getSessionFromRequest(req: NextRequest): Promise<SessionContext | null> {
    const cookieName = getSessionCookieName();
    const token = req.cookies.get(cookieName)?.value;
    if (!token) return null;

    return this.verifyToken(token);
  },

  /**
   * Verifies an opaque session token (using short-TTL Redis read-through cache when configured)
   * and returns the user + school context without leaking password hashes.
   */
  async verifyToken(token: string): Promise<SessionContext | null> {
    const tokenHash = hashToken(token);
    const cached = await systemCache.get<CachedSessionPayload>(sessionCacheKey(tokenHash));
    if (cached && cached.user && cached.expiresAtMs > Date.now()) {
      return {
        user: { ...(cached.user as UserRecord), passwordHash: "" },
        school: cached.school || null,
        sessionId: cached.sessionId,
      };
    }

    const session = await authRepository.findSessionByTokenHash(tokenHash);
    if (!session || !session.user) return null;

    const expiresAtMs = new Date(session.expiresAt).getTime();
    if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
      return null;
    }

    const { passwordHash: _omitted, ...safeUser } = session.user;
    void _omitted;
    const ttl = Math.min(
      SESSION_CACHE_TTL_SECONDS,
      Math.max(5, Math.floor((expiresAtMs - Date.now()) / 1000)),
    );
    await systemCache.set<CachedSessionPayload>(
      sessionCacheKey(tokenHash),
      {
        sessionId: session.id,
        expiresAtMs,
        user: safeUser,
        school: session.user.school || null,
      },
      ttl,
    );

    return {
      user: session.user,
      school: session.user.school || null,
      sessionId: session.id,
    };
  },

  /**
   * Revokes the current session and clears its Redis session cache entry.
   */
  async revokeSession(token: string): Promise<void> {
    const tokenHash = hashToken(token);
    await authRepository.revokeSession(tokenHash);
    await systemCache.del(sessionCacheKey(tokenHash));
  },

  /**
   * Invalidates cached Redis session entries for a list of revoked token hashes.
   */
  async invalidateSessionsByTokenHashes(tokenHashes: string[]): Promise<void> {
    if (tokenHashes.length === 0) return;
    await Promise.all(tokenHashes.map((hash) => systemCache.del(sessionCacheKey(hash))));
  },
};
