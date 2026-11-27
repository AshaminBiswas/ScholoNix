import "server-only";
import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
let ephemeralMfaSecret: string | null = null;

function getMasterKeyBytes(): Buffer {
  let raw = process.env.AUTH_SECRET?.trim();
  if (!raw) {
    if (process.env.NODE_ENV === "test") {
      if (!ephemeralMfaSecret) {
        ephemeralMfaSecret = crypto.randomBytes(32).toString("hex");
      }
      raw = ephemeralMfaSecret;
    } else {
      throw new Error("AUTH_SECRET is required for Company Admin MFA encryption.");
    }
  }
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptTotpSecret(base32Secret: string): string {
  const key = getMasterKeyBytes();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(base32Secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptTotpSecret(payload: string): string {
  const [ivB64, tagB64, encB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !encB64) {
    throw new Error("Malformed encrypted TOTP secret.");
  }
  const key = getMasterKeyBytes();
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivB64, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encB64, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function generateBase32Secret(byteLength = 20): string {
  const bytes = crypto.randomBytes(byteLength);
  let bits = 0;
  let value = 0;
  let output = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function decodeBase32(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/**
 * Generates a 6-digit RFC 6238 TOTP code for a given Base32 secret & timestamp.
 */
export function generateTotpCode(base32Secret: string, timestampMs = Date.now()): string {
  const counter = Math.floor(timestampMs / 1000 / 30);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuf.writeUInt32BE(counter >>> 0, 4);

  const key = decodeBase32(base32Secret);
  const hmac = crypto.createHmac("sha1", key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const codeInt =
    (((hmac[offset]! & 0x7f) << 24) |
      ((hmac[offset + 1]! & 0xff) << 16) |
      ((hmac[offset + 2]! & 0xff) << 8) |
      (hmac[offset + 3]! & 0xff)) %
    1_000_000;
  return String(codeInt).padStart(6, "0");
}

/**
 * Verifies a 6-digit TOTP token with +-1 30-second window drift tolerance.
 */
export function verifyTotpCode(
  base32Secret: string,
  tokenInput: string,
  timestampMs = Date.now(),
): boolean {
  const clean = tokenInput.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(clean)) return false;

  const expectedBuf = Buffer.from(clean, "utf8");
  for (const stepOffset of [-1, 0, 1]) {
    const candidate = generateTotpCode(base32Secret, timestampMs + stepOffset * 30_000);
    const candBuf = Buffer.from(candidate, "utf8");
    if (crypto.timingSafeEqual(expectedBuf, candBuf)) {
      return true;
    }
  }
  return false;
}

export function buildOtpAuthUri(email: string, base32Secret: string): string {
  const label = encodeURIComponent(`ScholoNix:${email}`);
  return `otpauth://totp/${label}?secret=${base32Secret}&issuer=ScholoNix&algorithm=SHA1&digits=6&period=30`;
}

export function generateRecoveryCodes(count = 8): {
  plaintextCodes: string[];
  hashes: string[];
} {
  const key = getMasterKeyBytes();
  const plaintextCodes: string[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const partA = crypto.randomBytes(2).toString("hex").toUpperCase();
    const partB = crypto.randomBytes(2).toString("hex").toUpperCase();
    const code = `${partA}-${partB}`;
    plaintextCodes.push(code);
    hashes.push(crypto.createHmac("sha256", key).update(code).digest("hex"));
  }
  return { plaintextCodes, hashes };
}

export function hashRecoveryCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  return crypto.createHmac("sha256", getMasterKeyBytes()).update(normalized).digest("hex");
}

export async function signWebAuthnChallenge(payload: {
  challenge: string;
  adminId?: string;
  purpose: "register" | "authenticate";
}): Promise<string> {
  return new SignJWT({
    challenge: payload.challenge,
    adminId: payload.adminId ?? null,
    purpose: payload.purpose,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(getMasterKeyBytes());
}

export async function verifyWebAuthnChallengeToken(
  token: string,
  expectedPurpose: "register" | "authenticate",
): Promise<{ challenge: string; adminId: string | null }> {
  const { payload } = await jwtVerify(token, getMasterKeyBytes());
  if (payload.purpose !== expectedPurpose || typeof payload.challenge !== "string") {
    throw new Error("Invalid or expired WebAuthn challenge.");
  }
  return {
    challenge: payload.challenge,
    adminId: typeof payload.adminId === "string" ? payload.adminId : null,
  };
}

/**
 * Verifies a WebAuthn Passkey assertion signature using Node's native crypto.verify
 * against the stored DER SPKI public key (`-7` ES256 or `-257` RS256).
 */
export function verifyPasskeyAssertion(params: {
  publicKeySpkiBase64Url: string;
  expectedChallenge: string;
  expectedOrigins: string[];
  expectedRpIds: string[];
  clientDataJSONBase64Url: string;
  authenticatorDataBase64Url: string;
  signatureBase64Url: string;
  storedCounter: number;
}): { valid: boolean; newCounter: number; reason?: string } {
  try {
    const clientDataBytes = Buffer.from(params.clientDataJSONBase64Url, "base64url");
    const clientData = JSON.parse(clientDataBytes.toString("utf8")) as {
      type?: string;
      challenge?: string;
      origin?: string;
    };

    if (clientData.type !== "webauthn.get") {
      return { valid: false, newCounter: params.storedCounter, reason: "Invalid WebAuthn type." };
    }
    if (clientData.challenge !== params.expectedChallenge) {
      return { valid: false, newCounter: params.storedCounter, reason: "Challenge mismatch." };
    }
    if (!clientData.origin || !params.expectedOrigins.includes(clientData.origin)) {
      return { valid: false, newCounter: params.storedCounter, reason: "Origin mismatch." };
    }

    const authData = Buffer.from(params.authenticatorDataBase64Url, "base64url");
    if (authData.length < 37) {
      return { valid: false, newCounter: params.storedCounter, reason: "Malformed authenticatorData." };
    }

    const rpIdHash = authData.subarray(0, 32);
    const rpMatches = params.expectedRpIds.some((rpId) => {
      const expectedHash = crypto.createHash("sha256").update(rpId).digest();
      return crypto.timingSafeEqual(rpIdHash, expectedHash);
    });
    if (!rpMatches) {
      return { valid: false, newCounter: params.storedCounter, reason: "RP ID hash mismatch." };
    }

    const flags = authData[32]!;
    const userPresent = Boolean(flags & 0x01);
    if (!userPresent) {
      return { valid: false, newCounter: params.storedCounter, reason: "User presence bit missing." };
    }

    const signCount = authData.readUInt32BE(33);
    if (params.storedCounter > 0 && signCount > 0 && signCount <= params.storedCounter) {
      return { valid: false, newCounter: params.storedCounter, reason: "Replay signCount detected." };
    }

    const clientDataHash = crypto.createHash("sha256").update(clientDataBytes).digest();
    const signedData = Buffer.concat([authData, clientDataHash]);
    const signature = Buffer.from(params.signatureBase64Url, "base64url");

    const publicKey = crypto.createPublicKey({
      key: Buffer.from(params.publicKeySpkiBase64Url, "base64url"),
      format: "der",
      type: "spki",
    });

    const verified = crypto.verify("sha256", signedData, publicKey, signature);
    if (!verified) {
      return { valid: false, newCounter: params.storedCounter, reason: "Signature verification failed." };
    }

    return { valid: true, newCounter: signCount };
  } catch {
    return { valid: false, newCounter: params.storedCounter, reason: "Assertion verification error." };
  }
}

export function verifyPasskeyRegistrationClientData(params: {
  clientDataJSONBase64Url: string;
  expectedChallenge: string;
  expectedOrigins: string[];
}): { valid: boolean; reason?: string } {
  try {
    const clientDataBytes = Buffer.from(params.clientDataJSONBase64Url, "base64url");
    const clientData = JSON.parse(clientDataBytes.toString("utf8")) as {
      type?: string;
      challenge?: string;
      origin?: string;
    };
    if (clientData.type !== "webauthn.create") {
      return { valid: false, reason: "Invalid WebAuthn registration type." };
    }
    if (clientData.challenge !== params.expectedChallenge) {
      return { valid: false, reason: "Passkey registration challenge mismatch." };
    }
    if (!clientData.origin || !params.expectedOrigins.includes(clientData.origin)) {
      return { valid: false, reason: "Passkey registration origin mismatch." };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: "Invalid passkey clientDataJSON payload." };
  }
}

export function resolveWebAuthnContext(req: {
  headers: { get(name: string): string | null };
  nextUrl: { host: string; protocol: string; origin: string };
}): { primaryRpId: string; expectedRpIds: string[]; expectedOrigins: string[] } {
  const host = (
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    req.nextUrl.host ||
    "localhost:3000"
  )
    .split(",")[0]!
    .trim();
  const proto = (
    req.headers.get("x-forwarded-proto") ||
    req.nextUrl.protocol.replace(":", "") ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https")
  )
    .split(",")[0]!
    .trim();

  const primaryRpId = host.split(":")[0]!.toLowerCase();
  const rpIds = new Set<string>([primaryRpId]);
  const origins = new Set<string>([`${proto}://${host}`]);

  if (req.nextUrl.origin && req.nextUrl.origin !== "null") {
    origins.add(req.nextUrl.origin);
  }

  for (const envUrl of [process.env.NEXT_PUBLIC_APP_URL, process.env.APP_URL]) {
    if (!envUrl) continue;
    try {
      const parsed = new URL(envUrl);
      origins.add(parsed.origin);
      rpIds.add(parsed.hostname.toLowerCase());
    } catch {
      // ignore invalid env URL
    }
  }

  return {
    primaryRpId,
    expectedRpIds: Array.from(rpIds),
    expectedOrigins: Array.from(origins),
  };
}
