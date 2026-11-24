import { test, expect } from "@playwright/test";

test.describe("Pricing Page Visual & Interactive Features", () => {
  test("renders all key sections and header according to design mockup", async ({
    page,
  }) => {
    await page.goto("/pricing");

    // 1. Header / Navbar
    const header = page.locator("header").first();
    await expect(header).toContainText("School Management SaaS");
    await expect(header).toContainText("Features");
    await expect(header).toContainText("Pricing");
    await expect(header).toContainText("For Schools");
    await expect(header).toContainText("Resources");
    await expect(header).toContainText("Sign In");
    await expect(header).toContainText("Register Now");

    // 2. Hero Section
    await expect(page.getByText("Pricing Plans")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Simple & Transparent Pricing", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText("Choose a plan that fits your school's needs. No hidden charges. Cancel anytime."),
    ).toBeVisible();

    // 3 Value Checkmarks
    await expect(page.getByText("Full Feature Access")).toBeVisible();
    await expect(page.getByText("Secure & Reliable")).toBeVisible();
    await expect(page.getByText("Dedicated Support").first()).toBeVisible();

    // 3. Billing Toggle
    await expect(page.getByRole("button", { name: "Monthly" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Yearly" })).toBeVisible();
    await expect(page.getByText("Save 20%")).toBeVisible();

    // 4. 3 Pricing Cards
    await expect(page.getByRole("heading", { name: "Starter", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Professional", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Enterprise", level: 3 })).toBeVisible();
    await expect(page.getByText("Most Popular")).toBeVisible();

    // Initial Monthly Prices
    await expect(page.getByText("₹1,999")).toBeVisible();
    await expect(page.getByText("₹3,999")).toBeVisible();
    await expect(page.getByText("₹7,999")).toBeVisible();

    // 5. Feature Comparison Table
    await expect(
      page.getByRole("heading", { name: "Feature Comparison", level: 2 }),
    ).toBeVisible();
    const table = page.locator("table");
    await expect(table.getByRole("cell", { name: "Student Management" })).toBeVisible();
    await expect(table.getByRole("cell", { name: "Fee Management & Online Payments" })).toBeVisible();
    await expect(table.getByRole("cell", { name: "Examinations & Report Cards" })).toBeVisible();
    await expect(table.getByRole("cell", { name: "Parent & Student Portal" })).toBeVisible();
    await expect(table.getByRole("cell", { name: "Multi-Branch / Multi-School" })).toBeVisible();
    await expect(table.getByRole("cell", { name: "Dedicated Manager" })).toBeVisible();

    // 6. Four Trust Badges
    await expect(page.getByRole("heading", { name: "Quick Setup" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cloud-Based" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Data Secure" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Expert Support" })).toBeVisible();

    // 7. FAQ Section
    await expect(
      page.getByRole("heading", { name: "Frequently Asked Questions", level: 2 }),
    ).toBeVisible();
    await expect(page.getByText("Can I change my plan later?")).toBeVisible();
    await expect(page.getByText("Is there a free trial?")).toBeVisible();
    await expect(page.getByText("What payment methods do you accept?")).toBeVisible();

    // 8. Ready to Get Started CTA Banner
    await expect(
      page.getByRole("heading", { name: "Ready to Get Started?", level: 2 }),
    ).toBeVisible();

    // 9. Footer
    const footer = page.locator("footer");
    await expect(footer).toContainText("School Management SaaS");
    await expect(footer).toContainText("Product");
    await expect(footer).toContainText("Resources");
    await expect(footer).toContainText("Company");
    await expect(footer).toContainText("Stay Updated");
    await expect(footer).toContainText("Made for Schools");
  });

  test("billing toggle switches prices and shows annual discount calculation", async ({
    page,
  }) => {
    await page.goto("/pricing");

    // Monthly is default
    await expect(page.getByText("₹1,999")).toBeVisible();
    await expect(page.getByText("₹3,999")).toBeVisible();
    await expect(page.getByText("₹7,999")).toBeVisible();

    // Switch to Yearly
    const yearlyBtn = page.getByRole("button", { name: "Yearly" });
    await yearlyBtn.click();

    // Yearly prices (20% discount applied)
    await expect(page.getByText("₹1,599")).toBeVisible();
    await expect(page.getByText("₹3,199")).toBeVisible();
    await expect(page.getByText("₹6,399")).toBeVisible();
    await expect(page.getByText("Billed annually (₹19,188/year)")).toBeVisible();

    // Switch back to Monthly
    const monthlyBtn = page.getByRole("button", { name: "Monthly" });
    await monthlyBtn.click();
    await expect(page.getByText("₹1,999")).toBeVisible();
    await expect(page.getByText("₹3,999")).toBeVisible();
    await expect(page.getByText("₹7,999")).toBeVisible();
  });

  test("FAQ accordion opens and closes questions smoothly", async ({ page }) => {
    await page.goto("/pricing");

    // First FAQ question is open by default
    await expect(
      page.getByText("Yes, you can upgrade, downgrade, or switch between monthly and annual billing"),
    ).toBeVisible();

    // Click to open second FAQ
    const faq2Btn = page.getByRole("button", { name: "Is there a free trial?" });
    await faq2Btn.click();
    await expect(
      page.getByText("Every new school gets a 14-day free trial with full access"),
    ).toBeVisible();

    // Click again to close
    await faq2Btn.click();
    await expect(
      page.getByText("Every new school gets a 14-day free trial with full access"),
    ).not.toBeVisible();
  });

  test("pricing card CTAs link to registration step 1 with corresponding preselected plan", async ({
    page,
  }) => {
    await page.goto("/pricing");

    // Test Starter CTA link
    const starterLink = page.locator('a[href*="/register?step=1&plan=starter"]').first();
    await expect(starterLink).toBeVisible();

    // Test Professional CTA link
    const proLink = page.locator('a[href*="/register?step=1&plan=professional"]').first();
    await expect(proLink).toBeVisible();

    // Test Enterprise CTA link
    const enterpriseLink = page.locator('a[href*="/register?step=1&plan=enterprise"]').first();
    await expect(enterpriseLink).toBeVisible();
  });

  test("clicking a pricing card applies thick border and selects that plan", async ({ page }) => {
    await page.goto("/pricing");

    // Initially Professional is selected with thick border class
    const proCard = page.locator('div:has(> div > h3:has-text("Professional"))').first();
    await expect(proCard).toHaveClass(/border-\[3\.5px\]/);
    await expect(proCard).toHaveClass(/border-\[#663CF6\]/);

    // Click Starter card
    const starterCard = page.locator('div:has(> div > h3:has-text("Starter"))').first();
    await starterCard.click();

    // Starter now has thick border
    await expect(starterCard).toHaveClass(/border-\[3\.5px\]/);
    await expect(starterCard).toHaveClass(/border-\[#663CF6\]/);

    // Click Enterprise card
    const enterpriseCard = page.locator('div:has(> div > h3:has-text("Enterprise"))').first();
    await enterpriseCard.click();

    // Enterprise now has thick border
    await expect(enterpriseCard).toHaveClass(/border-\[3\.5px\]/);
    await expect(enterpriseCard).toHaveClass(/border-\[#663CF6\]/);
  });

  test("pricing page mobile responsiveness test at 390px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/pricing");

    // Ensure zero horizontal scroll overflow on mobile
    const overflows = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const all = document.querySelectorAll("*");
      const bad = [];
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.right > docWidth + 1 || r.width > docWidth + 1) {
          bad.push({
            tag: el.tagName,
            cls: (el.className || "").toString().slice(0, 80),
            width: Math.round(r.width),
            right: Math.round(r.right),
            text: (el.textContent || "").slice(0, 30).trim(),
          });
        }
      }
      return {
        docWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bad: bad.slice(0, 10),
      };
    });

    console.log("PRICING PAGE MOBILE OVERFLOW:", JSON.stringify(overflows, null, 2));
    expect(overflows.scrollWidth <= overflows.docWidth).toBe(true);

    // Test mobile hamburger menu
    const menuBtn = page.getByRole("button", { name: "Toggle navigation menu" });
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // Mobile nav drawer should open
    await expect(page.getByRole("link", { name: "Features" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Pricing" }).first()).toBeVisible();
  });
});
