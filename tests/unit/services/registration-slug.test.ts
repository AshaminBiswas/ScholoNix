import { describe, expect, it } from "vitest";
import {
  generateSlug,
  generateSchoolCode,
} from "@/modules/schools/services/registration-service";

describe("Registration Service Utilities", () => {
  it("generates clean URL-safe slugs from complex school names", () => {
    expect(generateSlug("Sunrise International School")).toBe(
      "sunrise-international-school",
    );
    expect(generateSlug("Delhi Public School (R.K. Puram)")).toBe(
      "delhi-public-school-rk-puram",
    );
    expect(generateSlug("St. Xavier's High School")).toBe("st-xaviers-high-school");
  });

  it("generates concise institutional codes", () => {
    const code = generateSchoolCode("Sunrise International School", "201301");
    expect(code).toBe("SIS-301");
  });
});
