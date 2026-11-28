import crypto from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import {
  decryptTotpSecret,
  decryptTotpSecretWithRotation,
  encryptTotpSecret,
  generateTotpCode,
} from "@/server/platform/platform-mfa-crypto";

describe("Platform Admin MFA TOTP encryption & key rotation", () => {
  const originalAuthSecret = process.env.AUTH_SECRET;
  const originalPrevSecret = process.env.AUTH_SECRET_PREVIOUS;

  afterEach(() => {
    process.env.AUTH_SECRET = originalAuthSecret;
    process.env.AUTH_SECRET_PREVIOUS = originalPrevSecret;
  });

  it("handles quote-wrapped AUTH_SECRET consistently during encrypt and decrypt", () => {
    const keyMaterial = crypto.randomBytes(24).toString("hex");
    process.env.AUTH_SECRET = `"${keyMaterial}"`;
    const enc = encryptTotpSecret("JBSWY3DPEHPK3PXP");

    process.env.AUTH_SECRET = keyMaterial;
    expect(decryptTotpSecret(enc)).toBe("JBSWY3DPEHPK3PXP");
  });

  it("decrypts secrets encrypted with AUTH_SECRET_PREVIOUS and signals rotation", () => {
    const previousKey = crypto.randomBytes(24).toString("hex");
    const currentKey = crypto.randomBytes(24).toString("hex");

    process.env.AUTH_SECRET = previousKey;
    process.env.AUTH_SECRET_PREVIOUS = "";
    const encWithOld = encryptTotpSecret("JBSWY3DPEHPK3PXP");

    process.env.AUTH_SECRET = currentKey;
    process.env.AUTH_SECRET_PREVIOUS = previousKey;

    const res = decryptTotpSecretWithRotation(encWithOld);
    expect(res.secret).toBe("JBSWY3DPEHPK3PXP");
    expect(res.rotatedFromPreviousKey).toBe(true);
    expect(generateTotpCode(res.secret)).toMatch(/^\d{6}$/);
  });
});
