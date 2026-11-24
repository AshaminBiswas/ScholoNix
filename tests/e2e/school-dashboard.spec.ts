import { test, expect } from "@playwright/test";

test.describe("School Dashboard - Authentication Guard, Dynamic Multi-Tenant Data & UI", () => {
  test.describe("1. Authentication & Security Guard", () => {
    test("Unauthenticated user visiting /dashboard is redirected to /login", async ({ page }) => {
      // Clear cookies to ensure unauthenticated
      await page.context().clearCookies();
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

      // Must be redirected to /login with callbackUrl
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    });

    test("Unauthenticated request to /api/school/dashboard returns 401 Unauthorized", async ({
      request,
    }) => {
      const res = await request.get("/api/school/dashboard");
      expect(res.status()).toBe(401);
      const json = await res.json();
      expect(json.authenticated).toBe(false);
    });
  });

  test.describe("2. Registered School Dashboard Flow & Dynamic School Data", () => {
    test("Login as Sunrise International School and verify exact dashboard data", async ({
      page,
      request,
    }) => {
      test.setTimeout(60000);

      // 1. Authenticate via login API
      const loginRes = await request.post("/api/auth/login", {
        data: {
          method: "password",
          identifier: "+919876543210",
          password: "Password@123",
        },
      });
      expect(loginRes.status()).toBe(200);

      // Extract set-cookie
      const cookiesHeader = loginRes.headers()["set-cookie"];
      expect(cookiesHeader).toBeDefined();

      // Go to login page and login via UI
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto("/login?callbackUrl=/dashboard");

      await page.locator("#tab-signin-password").click();
      await page.locator("#login-id-input").fill("+919876543210");
      await page.locator("#login-password-input").fill("Password@123");
      await page.locator("#password-signin-btn").click();

      // Click Go to Dashboard on success modal
      await page.locator("#login-success-dashboard-btn").waitFor({ state: "visible", timeout: 15000 });
      await page.locator("#login-success-dashboard-btn").click();
      await page.waitForURL("**/dashboard**", { timeout: 15000 });
      await page.waitForLoadState("domcontentloaded");

      // Verify School Header & Greeting
      await expect(page.getByText("Sunrise International School").first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText("Good Morning, Rohan Mehta 👋")).toBeVisible();
      await expect(
        page.getByText("Here's what's happening at Sunrise International School today.")
      ).toBeVisible();

      // Verify 4 Top Metric Cards
      await expect(page.getByText("Total Students")).toBeVisible();
      await expect(page.getByText("1,248").first()).toBeVisible();
      await expect(page.getByText("Total Staff").first()).toBeVisible();
      await expect(page.getByText("86").first()).toBeVisible();
      await expect(page.getByText("Pending Admissions")).toBeVisible();
      await expect(page.getByText("37", { exact: true }).first()).toBeVisible();
      await expect(page.getByText("Fee Dues", { exact: true }).first()).toBeVisible();
      await expect(page.getByText("₹5,48,000").first()).toBeVisible();

      // Verify Attendance
      await expect(page.getByText("96.4%").first()).toBeVisible();
      await expect(page.getByText("1,204").first()).toBeVisible();

      // Verify Tasks Checklist interactivity
      const taskCheckbox = page.locator("input[type='checkbox']").first();
      await expect(taskCheckbox).toBeChecked();
      await taskCheckbox.click();
      await expect(taskCheckbox).not.toBeChecked();

      // Re-check
      await taskCheckbox.click();
      await expect(taskCheckbox).toBeChecked();

      // Verify Recent Admissions Table
      await expect(page.getByText("Aarav Sharma").first()).toBeVisible();
      await expect(page.getByText("Diya Verma").first()).toBeVisible();
      await expect(page.getByText("Ishaan Gupta").first()).toBeVisible();

      // Verify Academic Performance
      await expect(page.getByText("84.2%").first()).toBeVisible();
      await expect(page.getByText("Class X A").first()).toBeVisible();

      // Verify Upcoming Events
      await expect(page.getByText("Parent-Teacher Meeting (Classes I – V)").first()).toBeVisible();
      await expect(page.getByText("Republic Day Celebration").first()).toBeVisible();
    });

    test("Switch to Apex Global Academy dynamically updates dashboard data", async ({
      page,
      request,
    }) => {
      // Login first
      const loginRes = await request.post("/api/auth/login", {
        data: {
          method: "password",
          identifier: "+919876543210",
          password: "Password@123",
        },
      });
      expect(loginRes.status()).toBe(200);

      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto("/dashboard?demo=true");

      // Verify Sunrise is loaded first
      await expect(page.getByText("Sunrise International School").first()).toBeVisible();

      // Open School Switcher Dropdown
      const schoolDropdownBtn = page.locator("#school-switcher-dropdown-btn");
      const apexBtn = page.locator("#switch-school-sch_apex_002");

      await schoolDropdownBtn.click();
      await apexBtn.waitFor({ state: "visible", timeout: 10000 });
      await apexBtn.click();

      // Verify Data is now completely different and matches Apex Global Academy
      await expect(page.getByText("Apex Global Academy").first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("1,890").first()).toBeVisible(); // Apex total students
      await expect(page.getByText("112").first()).toBeVisible(); // Apex total staff
      await expect(page.getByText("₹8,12,000")).toBeVisible(); // Apex fee dues
      await expect(page.getByText("97.2%")).toBeVisible(); // Apex attendance
      await expect(page.getByText("Kabir Sen").first()).toBeVisible(); // Apex student applicant
      await expect(page.getByText("Inter-School Science Olympiad 2026")).toBeVisible(); // Apex event
    });

    test("Switch to St. Xavier's International School dynamically updates data", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto("/dashboard?demo=true&schoolId=sch_xavier_003");

      // Verify St. Xavier's data
      await expect(page.getByText("St. Xavier's International School").first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("2,150").first()).toBeVisible(); // St. Xavier's total students
      await expect(page.getByText("140").first()).toBeVisible(); // St. Xavier's total staff
      await expect(page.getByText("₹4,20,000")).toBeVisible(); // St. Xavier's fee dues
      await expect(page.getByText("91.4%").first()).toBeVisible(); // St. Xavier's pass rate
      await expect(page.getByText("Samuel D'Souza")).toBeVisible(); // St. Xavier's student
      await expect(page.getByText("Annual Cultural Festival & Dramatics")).toBeVisible();
    });

    test("Mobile View: Responsive without horizontal overflow, mobile drawer functions", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/dashboard?demo=true");

      // Check horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

      // Open mobile drawer
      const menuBtn = page.getByRole("button", { name: /Toggle navigation drawer/i });
      await expect(menuBtn).toBeVisible();
      await menuBtn.click();

      // Check sidebar links are visible in drawer
      await expect(page.getByRole("complementary").getByRole("link", { name: "Dashboard" })).toBeVisible();
      await expect(page.getByRole("complementary").getByText("Admissions")).toBeVisible();
    });
  });
});
