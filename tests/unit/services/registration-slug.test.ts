import { randomBytes } from "crypto";
import { describe, expect, it } from "vitest";
import {
  generateSlug,
  generateSchoolCode,
  generateUniqueSchoolId,
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

  it("generates opaque non-name URL tokens and collision-free Unique School IDs", async () => {
    expect(isReservedSchoolSlug("help")).toBe(true);
    expect(isReservedSchoolSlug("login")).toBe(true);
    expect(isReservedSchoolSlug("dashboard")).toBe(true);
    expect(isReservedSchoolSlug("admin")).toBe(true);
    expect(isReservedSchoolSlug("synthetic-academy-slug")).toBe(false);

    const firstSlug = await generateUniqueSchoolSlug("Sunrise International Academy");
    expect(firstSlug).toMatch(/^sc_[0-9a-f]{20,}$/);
    expect(firstSlug).not.toContain("sunrise");
    expect(firstSlug).not.toContain("international");
    expect(firstSlug).not.toContain("academy");

    const uniqueId = await generateUniqueSchoolId();
    expect(uniqueId).toMatch(/^SNX-\d{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6,}$/);

    const passwordHash = await hashPassword(`Pass!${randomBytes(8).toString("hex")}1`);
    await authRepository.createUserWithSchool({
      school: {
        name: "Sunrise International Academy",
        slug: firstSlug,
        uniqueId,
        code: "SIA-101",
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

    const secondSlug = await generateUniqueSchoolSlug("Sunrise International Academy");
    expect(secondSlug).toMatch(/^sc_[0-9a-f]{20,}$/);
    expect(secondSlug).not.toBe(firstSlug);
  });
});
