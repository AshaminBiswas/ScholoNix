import { randomBytes } from "crypto";
import { test, expect } from "@playwright/test";

test.describe("Full School Signup & Login End-to-End Workflow", () => {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const testPhone = "98" + Math.floor(10000000 + Math.random() * 90000000).toString();
  const testEmail = `principal.${Date.now()}@e2etest.edu.in`;
  const schoolName = `Greenwood World Academy ${randomSuffix}`;
  const passphrase = `E2E!${randomBytes(8).toString("hex")}9`;

  test("1. Complete School Signup Wizard Step 1 & Step 2 Validation", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/step=1/);

    // STEP 1: Institution Details
    await page.locator("input[placeholder*='Sunrise']").fill(schoolName);
    await page.locator("input[placeholder*='98765 43210']").first().fill(testPhone);
    await page.locator("input[placeholder*='Green Valley Road']").fill("Plot 10, Knowledge Park");
    await page.locator("input[placeholder*='Noida']").fill("Bengaluru");

    const stateSelect = page.locator("select").nth(2);
    if (await stateSelect.isVisible()) {
      await stateSelect.selectOption("Karnataka");
    }

    await page.locator("input[placeholder*='201301']").fill("560001");
    await page.locator("#continue-to-admin-btn").click();

    await expect(page).toHaveURL(/step=2/);
    await expect(page.getByRole("heading", { name: "Administrator Details", level: 2 })).toBeVisible();

    // STEP 2: Administrator Details
    await page.locator("input[placeholder*='Rohan Mehta']").fill("Dr. Sunil Sharma");
    await page.locator("input[placeholder*='98765 43210']").fill(testPhone);
    await page.locator("input[placeholder*='principal@sunrise']").fill(testEmail);
    await page.locator("input[type='password']").first().fill(passphrase);
    await page.locator("input[type='password']").nth(1).fill(passphrase);

    await page.locator("#continue-to-verify-mobile-btn").click();
    await expect(page).toHaveURL(/step=3/);
    await expect(page.getByRole("heading", { name: "Verify & Confirm", level: 2 })).toBeVisible();
  });

  test("2. Rejects invalid credentials cleanly without seeded demo accounts", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: {
        method: "password",
        identifier: `nonexistent.${Date.now()}@scholonix.example`,
        password: passphrase,
      },
    });
    expect(res.status()).toBe(401);
  });

  test("3. Health Check Endpoint validates system liveness", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("school-management-saas");
  });
});
