import { test, expect } from "@playwright/test";

test.describe("School Dashboard - Authentication Guard & Tenant Boundary", () => {
  test("Unauthenticated user visiting /dashboard is redirected to /login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("Unauthenticated user visiting /dashboard?demo=true is also redirected to /login", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard?demo=true", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("Unauthenticated user visiting a per-school workspace or in-portal help URL is redirected to /login", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await page.goto("/synthetic-school-slug", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });

    await page.goto("/synthetic-school-slug/help", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });

    await page.goto("/synthetic-school-slug/admissions", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("Unauthenticated requests to school dashboard APIs return 401 Unauthorized", async ({
    request,
  }) => {
    const res = await request.get("/api/school/dashboard");
    expect(res.status()).toBe(401);
    const json = await res.json();
    expect(json.authenticated).toBe(false);

    const demoBypassRes = await request.get("/api/school/dashboard?demo=true");
    expect(demoBypassRes.status()).toBe(401);

    const schoolsRes = await request.get("/api/school/schools");
    expect(schoolsRes.status()).toBe(401);

    const admissionsRes = await request.get("/api/school/admissions/overview");
    expect(admissionsRes.status()).toBe(401);
  });
});
