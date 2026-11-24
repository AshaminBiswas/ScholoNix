import { describe, expect, it } from "vitest";
import { z } from "zod";

const testSchema = z.object({
  schoolSlug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must only contain lowercase letters, numbers, and hyphens",
    ),
  port: z.coerce.number().int().min(1024).max(65535).default(3000),
});

describe("Zod validation schemas", () => {
  it("validates a compliant tenant slug", () => {
    const validData = { schoolSlug: "greenwood-high" };
    const parsed = testSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.schoolSlug).toBe("greenwood-high");
      expect(parsed.data.port).toBe(3000);
    }
  });

  it("rejects uppercase and special characters in school slug", () => {
    const invalidData = { schoolSlug: "Greenwood_High!" };
    const parsed = testSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it("rejects overly short school slugs", () => {
    const invalidData = { schoolSlug: "gh" };
    const parsed = testSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });
});
