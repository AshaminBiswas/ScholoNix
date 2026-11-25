import { randomBytes } from "crypto";
import { describe, expect, it } from "vitest";
import {
  generateSlug,
  generateSchoolCode,
  generateUniqueSchoolSlug,
  isReservedSchoolSlug,
} from "@/modules/schools/services/registration-service";
import { authRepository } from "@/server/auth/auth-repository";
import { hashPassword } from "@/server/security/crypto";

describe("Registration Service Utilities", () => {
  it("generates clean URL-safe slugs from complex school names", () => {
    expect(generateSlug("Synthetic Global Academy")).toBe(
      "synthetic-global-academy",
    );
    expect(generateSlug("Delhi Public School (R.K. Puram)")).toBe(
      "delhi-public-school-rk-puram",
    );
    expect(generateSlug("St. Xavier's High School")).toBe("st-xaviers-high-school");
  });

  it("generates concise institutional codes", () => {
    const code = generateSchoolCode("Synthetic Global Academy", "201301");
    expect(code).toBe("SGA-301");
  });

  it("blocks reserved platform route slugs and deduplicates school slugs", async () => {
    expect(isReservedSchoolSlug("help")).toBe(true);
    expect(isReservedSchoolSlug("login")).toBe(true);
    expect(isReservedSchoolSlug("dashboard")).toBe(true);
    expect(isReservedSchoolSlug("synthetic-academy-slug")).toBe(false);

    const reservedResolved = await generateUniqueSchoolSlug("Help");
    expect(reservedResolved).toBe("help-school");

    const baseName = `Unique Test School ${Date.now()}`;
    const firstSlug = await generateUniqueSchoolSlug(baseName);
    expect(firstSlug).toBe(generateSlug(baseName));

    const passwordHash = await hashPassword(`Pass!${randomBytes(8).toString("hex")}1`);
    await authRepository.createUserWithSchool({
      school: {
        name: baseName,
        slug: firstSlug,
        code: "UTS-101",
        category: "Co-Educational School",
      },
      user: {
        name: "Slug Test Admin",
        email: `slug.admin.${Date.now()}@scholonix.example`,
        phone: `+9198${Math.floor(10000000 + Math.random() * 89999999)}`,
        passwordHash,
        role: "SCHOOL_ADMIN",
        phoneVerified: true,
        emailVerified: true,
      },
    });

    const secondSlug = await generateUniqueSchoolSlug(baseName);
    expect(secondSlug).toBe(`${firstSlug}-2`);
    expect(secondSlug).not.toBe(firstSlug);
  });
});
