import "server-only";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const DEFAULT_AUTH_SECRET =
  process.env.AUTH_SECRET ||
  "scholonix_super_secret_auth_key_needs_32_characters_minimum";

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 * Range: 100000 to 999999.
 */
export function generateSecureOtp(): string {
  const code = crypto.randomInt(100000, 1000000);
  return code.toString();
}

/**
 * Creates an HMAC-SHA256 hash of an OTP code using the system secret.
 * Plaintext OTPs should NEVER be stored in the database.
 */
export function hashOtp(code: string, secret: string = DEFAULT_AUTH_SECRET): string {
  return crypto.createHmac("sha256", secret).update(code.trim()).digest("hex");
}

/**
 * Verifies an OTP code against a stored HMAC-SHA256 hash in constant time.
 * Prevents timing attacks.
 */
export function verifyOtpHash(
  code: string,
  storedHash: string,
  secret: string = DEFAULT_AUTH_SECRET,
): boolean {
  try {
    const computedHash = hashOtp(code, secret);
    const computedBuffer = Buffer.from(computedHash, "hex");
    const storedBuffer = Buffer.from(storedHash, "hex");

    if (computedBuffer.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuffer, storedBuffer);
  } catch {
    return false;
  }
}

/**
 * Hashes a user password using bcrypt with 10 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/**
 * Generates a cryptographically secure random token (e.g. for session IDs, verification tokens).
 */
export function generateSecureToken(byteLength: number = 32): string {
  return crypto.randomBytes(byteLength).toString("hex");
}

/**
 * Hashes an opaque token using SHA-256 for secure database lookup.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Masks an email address for safe display in logs and UI (e.g. p****l@school.edu.in).
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email;
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return email;

  if (localPart.length <= 2) {
    return `${localPart[0]}*@${domain}`;
  }

  const firstChar = localPart[0];
  const lastChar = localPart[localPart.length - 1];
  const maskedLength = Math.max(localPart.length - 2, 3);
  const asterisks = "*".repeat(maskedLength);

  return `${firstChar}${asterisks}${lastChar}@${domain}`;
}

/**
 * Normalizes a phone number to standard format with country code (e.g. +91 9876543210).
 */
export function normalizePhone(rawPhone: string, defaultCountryCode: string = "+91"): string {
  const cleaned = rawPhone.replace(/[^\d+]/g, "").trim();
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  // Strip leading 0
  const withoutZero = cleaned.replace(/^0+/, "");
  // If 10 digits, add default country code
  if (withoutZero.length === 10) {
    const code = defaultCountryCode.startsWith("+") ? defaultCountryCode : `+${defaultCountryCode}`;
    return `${code}${withoutZero}`;
  }
  // If starts with 91 and 12 digits
  if (withoutZero.startsWith("91") && withoutZero.length === 12) {
    return `+${withoutZero}`;
  }
  return `+${withoutZero}`;
}

/**
 * Masks a phone number for safe display in logs and UI (e.g. +91 98*** **210).
 */
export function maskPhone(phone: string): string {
  const clean = phone.replace(/\s+/g, "");
  if (clean.length < 7) return clean;

  const prefix = clean.slice(0, clean.length - 7);
  const start = clean.slice(clean.length - 7, clean.length - 4);
  const end = clean.slice(clean.length - 2);

  return `${prefix} ${start}** **${end}`;
}
