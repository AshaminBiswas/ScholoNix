import { randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import {
  GET as settingsGet,
  PATCH as settingsPatch,
} from "@/app/api/school/admissions/settings/route";
import { createDefaultExtendedSettings } from "@/modules/school/admissions/types";
import { authRepository } from "@/server/auth/auth-repository";
import { getSessionCookieName, sessionService } from "@/server/auth/session-service";
import { hashPassword } from "@/server/security/crypto";

async function seedSchoolAdmin(tag: string) {
  const unique = `${tag}-${Date.now()}-${randomBytes(3).toString("hex")}`.toLowerCase();
  const passwordHash = await hashPassword(`Set!${randomBytes(8).toString("hex")}7`);
  const { school, user } = await authRepository.createUserWithSchool({
    school: {
      name: `Settings School ${tag} ${unique}`,
      slug: `sc_${randomBytes(10).toString("hex")}`,
      code: `ST-${randomBytes(2).toString("hex").toUpperCase()}`,
      category: "Co-Educational School",
      affiliationBoard: "CBSE",
      city: "Jaipur",
      state: "Rajasthan",
      pinCode: "302001",
      country: "India",
    },
    user: {
      name: `Principal ${tag}`,
      email: `settings.${unique}@scholonix.example`,
      phone: `+9196${Math.floor(10000000 + Math.random() * 89999999)}`,
      passwordHash,
      role: "PRINCIPAL",
      phoneVerified: true,
      emailVerified: true,
    },
  });
  const session = await sessionService.createSession(user);
  const cookieHeader = `${getSessionCookieName()}=${session.token}`;
  return { school, user, cookieHeader };
}

describe("Per-School Customizable Admission Settings API", () => {
  it("isolates custom settings per school, preserves legacy minimal patches, and validates quota sum", async () => {
    const schoolA = await seedSchoolAdmin("alpha");
    const schoolB = await seedSchoolAdmin("beta");

    const customExtended = {
      ...createDefaultExtendedSettings(),
      admissionMode: "ONLINE_ONLY" as const,
      lateFeeAmount: 750,
      totalSeatsPerClass: 80,
      quotas: [
        { id: "general", name: "General", percentage: 60 },
        { id: "rte", name: "RTE Quota", percentage: 25 },
        { id: "staff", name: "Staff Ward", percentage: 15 },
      ],
      documentRequirements: [
        { id: "doc1", label: "Birth Certificate", mandatory: true },
        { id: "doc2", label: "Medical Fitness Certificate", mandatory: false },
      ],
      customFields: [
        { id: "cf1", label: "Transport Pickup Point", type: "text" as const, required: false },
      ],
    };

    const patchA = await settingsPatch(
      new NextRequest(
        `http://localhost/api/school/admissions/settings?schoolSlug=${schoolA.school.slug}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: schoolA.cookieHeader,
          },
          body: JSON.stringify({
            currentAcademicYear: "2027 – 2028",
            applicationDeadline: "2027-03-31",
            applicationPrefix: "ALPHA",
            enabledGrades: ["Nursery", "LKG", "UKG"],
            extendedConfig: customExtended,
          }),
        },
      ),
    );
    expect(patchA.status).toBe(200);
    const jsonA = await patchA.json();
    expect(jsonA.settings.applicationPrefix).toBe("ALPHA");
    expect(jsonA.settings.extendedConfig.totalSeatsPerClass).toBe(80);
    expect(jsonA.settings.extendedConfig.quotas).toHaveLength(3);
    expect(jsonA.settings.extendedConfig.customFields[0].label).toBe("Transport Pickup Point");

    // School B remains completely unaffected by School A's customizations
    const getB = await settingsGet(
      new NextRequest(
        `http://localhost/api/school/admissions/settings?schoolSlug=${schoolB.school.slug}`,
        { headers: { cookie: schoolB.cookieHeader } },
      ),
    );
    expect(getB.status).toBe(200);
    const jsonB = await getB.json();
    expect(jsonB.settings.applicationPrefix).toBe("APP");
    expect(jsonB.settings.extendedConfig.totalSeatsPerClass).toBe(60);
    expect(jsonB.settings.extendedConfig.customFields).toHaveLength(0);

    // School B accepts legacy minimal PATCH payload without extendedConfig
    const legacyPatchB = await settingsPatch(
      new NextRequest(
        `http://localhost/api/school/admissions/settings?schoolSlug=${schoolB.school.slug}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: schoolB.cookieHeader,
          },
          body: JSON.stringify({
            currentAcademicYear: "2026 – 2027",
            applicationDeadline: null,
            applicationPrefix: "BETA",
            enabledGrades: ["Class I", "Class II"],
          }),
        },
      ),
    );
    expect(legacyPatchB.status).toBe(200);
    const legacyJsonB = await legacyPatchB.json();
    expect(legacyJsonB.settings.applicationPrefix).toBe("BETA");

    // Quota percentage exceeding 100% is rejected cleanly
    const badQuotaRes = await settingsPatch(
      new NextRequest(
        `http://localhost/api/school/admissions/settings?schoolSlug=${schoolA.school.slug}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: schoolA.cookieHeader,
          },
          body: JSON.stringify({
            currentAcademicYear: "2027 – 2028",
            applicationPrefix: "ALPHA",
            enabledGrades: ["Nursery"],
            extendedConfig: {
              ...customExtended,
              quotas: [
                { id: "g", name: "General", percentage: 75 },
                { id: "m", name: "Management", percentage: 40 },
              ],
            },
          }),
        },
      ),
    );
    expect(badQuotaRes.status).toBe(400);
  });
});
