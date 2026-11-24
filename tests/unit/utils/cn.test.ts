import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils/cn";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    const result = cn("px-2", "py-1", "bg-blue-500");
    expect(result).toBe("px-2 py-1 bg-blue-500");
  });

  it("handles conditional classes properly", () => {
    const isPrimary = true;
    const isLarge = false;
    const result = cn("btn", isPrimary && "btn-primary", isLarge && "btn-lg");
    expect(result).toBe("btn btn-primary");
  });

  it("resolves conflicting Tailwind CSS utility classes", () => {
    const result = cn("p-4", "p-2");
    expect(result).toBe("p-2");
  });
});
