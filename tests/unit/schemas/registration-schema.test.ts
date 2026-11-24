import { describe, expect, it } from "vitest";
import {
  institutionDetailsSchema,
  administratorDetailsSchema,
} from "@/modules/schools/schemas/registration";

describe("School Registration Schemas", () => {
  it("validates compliant institution details matching Indian school standards", () => {
    const validData = {
      name: "Sunrise International School",
      category: "Co-Educational School",
      affiliationBoard: "CBSE",
      contactPhone: "+91 98765 43210",
      website: "https://www.sunriseis.edu.in",
      addressLine: "123, Green Valley Road",
      locality: "Sector 18",
      city: "Noida",
      state: "Uttar Pradesh",
      pinCode: "201301",
      country: "India",
    };

    const parsed = institutionDetailsSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid Indian PIN codes", () => {
    const invalidData = {
      name: "Sunrise International School",
      category: "Co-Educational School",
      contactPhone: "+91 98765 43210",
      addressLine: "123, Green Valley Road",
      city: "Noida",
      state: "Uttar Pradesh",
      pinCode: "123", // Too short
    };

    const parsed = institutionDetailsSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it("validates administrator details and catches password mismatch", () => {
    const mismatchData = {
      adminName: "Dr. Rajesh Sharma",
      adminPhone: "+91 98765 43210",
      adminEmail: "principal@sunriseis.edu.in",
      password: "Password123",
      confirmPassword: "DifferentPassword123",
    };

    const parsed = administratorDetailsSchema.safeParse(mismatchData);
    expect(parsed.success).toBe(false);
  });
});
