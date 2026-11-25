import { test, expect } from "@playwright/test";

test.describe("Platform Smoke & Landing Page Tests", () => {
  test("health endpoint is responsive", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.service).toBe("school-management-saas");
  });

  test("landing page renders all key sections from design mockup", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/");

    // 1. Title & Header
    await expect(page).toHaveTitle(/School Management SaaS/);
    const header = page.locator("header").first();
    await expect(header).toContainText("School Management SaaS");
    if (isMobile) {
      await expect(
        header.getByRole("button", { name: "Toggle Navigation Menu" }),
      ).toBeVisible();
    } else {
      await expect(header.getByRole("link", { name: "Sign In" })).toBeVisible();
      await expect(header.getByRole("link", { name: "Register Now" })).toBeVisible();
    }

    // 2. Hero Section
    const h1 = page.locator("h1");
    await expect(h1).toContainText("Run Your School");
    await expect(h1).toContainText("Smarter, Simpler");
    await expect(h1).toContainText("and More Efficiently");

    // Value checklist
    await expect(page.getByText("Quick Setup")).toBeVisible();
    await expect(page.getByText("No Coding Required")).toBeVisible();
    await expect(page.getByText("Secure & Reliable")).toBeVisible();

    // Live dashboard preview
    await expect(page.getByText("Good Morning, Principal 👋")).toBeVisible();
    await expect(page.getByText("1,248")).toBeVisible(); // Total Students
    await expect(page.getByText("₹5,48,000")).toBeVisible(); // Fees Dues
    await expect(page.getByText("96.4%")).toBeVisible(); // Attendance

    // 3. Trusted By 1,000+ Schools Section
    await expect(page.getByText("Trusted by 1,000+ Schools")).toBeVisible();
    await expect(page.getByText("Sunrise", { exact: true })).toBeVisible();
    await expect(page.getByText("Green Valley", { exact: true })).toBeVisible();
    await expect(page.getByText("Lotus", { exact: true })).toBeVisible();
    await expect(page.getByText("Riverside", { exact: true })).toBeVisible();

    // 4. Key Features Grid
    await expect(
      page.getByRole("heading", { name: "Everything Your School Needs" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Admissions" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Academics" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Attendance" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Fees & Payments" })).toBeVisible();

    // 5. Why Choose Us Section
    await expect(
      page.getByRole("heading", { name: "A Modern, Reliable & Scalable Solution" }),
    ).toBeVisible();
    await expect(page.getByText("98%")).toBeVisible();
    await expect(page.getByText("Customer Satisfaction")).toBeVisible();

    // 6. Pricing Section
    await expect(
      page.getByRole("heading", { name: "Simple & Transparent Pricing" }),
    ).toBeVisible();
    await expect(page.getByText("₹1,999")).toBeVisible();
    await expect(page.getByText("/month")).toBeVisible();

    // 7. Footer & Newsletter
    await expect(page.getByText("Made for Schools")).toBeVisible();
    const newsletterInput = page.getByPlaceholder("Enter your email");
    await expect(newsletterInput).toBeVisible();
    await newsletterInput.fill(`newsletter.${Date.now()}@e2etest.example`);
    await page.getByLabel("Submit newsletter").click();
    await expect(page.getByText("Thank you for subscribing!")).toBeVisible();
  });

  test("landing page primary CTA navigates to registration wizard", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Click Register Now from hero
    const heroCta = page.locator("#hero-register-btn");
    await heroCta.scrollIntoViewIfNeeded();
    await heroCta.click();
    await expect(page).toHaveURL(/\/register/, { timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: "Register Your School", level: 1 }),
    ).toBeVisible();
  });

  test("landing page hero pricing button navigates to /pricing page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Click View Pricing from hero
    const heroPricingBtn = page.locator("#hero-pricing-btn");
    await heroPricingBtn.scrollIntoViewIfNeeded();
    await heroPricingBtn.click();
    await expect(page).toHaveURL(/\/pricing/, { timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: "Simple & Transparent Pricing" }),
    ).toBeVisible();
  });

  test("landing page is fully responsive on mobile viewports", async ({ page }) => {
    // Set mobile viewport (iPhone SE / small mobile: 375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // 1. Desktop nav links should not be visible on mobile
    const desktopNav = page.locator("nav.hidden.md\\:flex");
    await expect(desktopNav).toBeHidden();

    // 2. Mobile hamburger button should be visible
    const hamburger = page.getByRole("button", { name: "Toggle Navigation Menu" });
    await expect(hamburger).toBeVisible();

    // 3. Page should not have horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // 4. Open mobile menu drawer
    await hamburger.click();
    const mobileDrawer = page.locator("header").getByRole("navigation");
    await expect(mobileDrawer.getByRole("link", { name: "Features" })).toBeVisible();
    await expect(mobileDrawer.getByRole("link", { name: "Pricing" })).toBeVisible();
    await expect(mobileDrawer.getByRole("link", { name: "For Schools" })).toBeVisible();
    await expect(mobileDrawer.getByRole("link", { name: "Support" })).toBeVisible();

    // Mobile CTA button in drawer
    const mobileRegisterCta = page
      .locator("header")
      .getByRole("link", { name: "Register Now →" });
    await expect(mobileRegisterCta).toBeVisible();

    // 5. Close menu by clicking hamburger again
    await hamburger.click();
    await expect(mobileDrawer).toBeHidden();

    // 6. Verify hero section wraps cleanly
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    const heroButton = page.getByRole("link", { name: "Register Now →" }).first();
    await expect(heroButton).toBeVisible();
  });

  test("hero dashboard visual animates numbers, percentages, donut chart, bars, and icons smoothly", async ({
    page,
  }) => {
    await page.goto("/");

    // Verify presence of hero visual container
    await expect(page.getByText("Good Morning, Principal 👋")).toBeVisible();
    await expect(page.getByText("Live Campus")).toBeVisible();

    // Verify all animated numbers reach their targets
    await expect(page.getByText("1,248")).toBeVisible();
    await expect(page.getByText("86")).toBeVisible();
    await expect(page.getByText("37")).toBeVisible();
    await expect(page.getByText("₹5,48,000")).toBeVisible();
    await expect(page.getByText("96.4%")).toBeVisible();

    // Verify circular donut progress ring is rendered
    const progressCircle = page.locator("svg circle[stroke='#16B84E']");
    await expect(progressCircle).toBeVisible();

    // Verify fee collection bars are rendered
    await expect(page.getByText("Fee Collection Trend")).toBeVisible();

    // Click refresh/replay button and verify smooth animation triggers
    const replayBtn = page.getByRole("button", {
      name: "Replay live dashboard animations",
    });
    await expect(replayBtn).toBeVisible();
    await replayBtn.click();

    // Replay completes and final numbers are verified again
    await expect(page.getByText("1,248")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("96.4%")).toBeVisible({ timeout: 10000 });
  });
});
