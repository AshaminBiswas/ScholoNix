import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("Health API Route", () => {
  it("returns status 200 with service information", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("status", "ok");
    expect(data).toHaveProperty("service", "school-management-saas");
    expect(data).toHaveProperty("timestamp");
  });
});
