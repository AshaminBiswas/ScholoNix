import { test, expect } from "@playwright/test";

test.describe("For Schools Page Visual & Interactive Workflows", () => {
  test("renders all key sections, hero illustration, 4 value cards, and 8 feature cards", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/for-schools");

    // 1. Header / Navbar
    const header = page.locator("header").first();
    await expect(header).toContainText("School Management SaaS");
    if (!isMobile) {
      await expect(header).toContainText("Features");
      await expect(header).toContainText("Pricing");
      await expect(header).toContainText("For Schools");
      await expect(header).toContainText("Resources");
      await expect(header).toContainText("Sign In");
      await expect(header).toContainText("Get Started Free");
    }

    // 2. Hero Section
    const heroSection = page.locator("section").first();
    await expect(heroSection.getByText("For Schools", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Built for Schools, Trusted by Educators",
        level: 1,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("A complete school management platform that helps schools streamline operations"),
    ).toBeVisible();

    // 3 Value Checkmarks
    await expect(page.getByText("All-in-One Platform")).toBeVisible();
    await expect(page.getByText("Easy to Set Up")).toBeVisible();
    await expect(page.getByText("Trusted by 1,000+ Schools")).toBeVisible();

    // Hero Action Buttons
    await expect(page.locator("#book-demo-hero-btn")).toBeVisible();

    // Hero School Building Illustration
    const illustration = page.locator('svg[aria-label="Modern School Building Illustration"]').first();
    await expect(illustration).toBeVisible();

    // 3. "Why for Schools?" Section
    await expect(page.getByText("Why for Schools?")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Everything Your School Needs in One Platform",
        level: 2,
      }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Streamline Operations", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Improve Collaboration", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Make Data-Driven Decisions", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Secure & Reliable", level: 3 })).toBeVisible();

    // 4. "All Features" Section Header
    await expect(page.getByText("All Features", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Manage Your School End-to-End",
        level: 2,
      }),
    ).toBeVisible();

    // Scroll to "All Features" cards to trigger IntersectionObserver
    const allFeaturesHeading = page.getByRole("heading", {
      name: "Manage Your School End-to-End",
      level: 2,
    });
    await allFeaturesHeading.scrollIntoViewIfNeeded();

    // All 8 Feature Cards
    await expect(page.getByRole("heading", { name: "Admissions", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Academics", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Attendance", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Fees & Payments", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Staff Management", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Parents & Communication", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Reports & Analytics", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cloud & Security", level: 3 })).toBeVisible();

    // Verify Explore Now links
    const exploreLinks = page.getByRole("link", { name: "Explore Now" });
    await expect(exploreLinks).toHaveCount(8);

    // 5. "For Every Type of School" Section
    await expect(page.getByText("For Every Type of School")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "A Perfect Fit for Your School", level: 2 }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "K-12 Schools" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "CBSE / ICSE Schools" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "State Board Schools" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "International Schools" })).toBeVisible();

    // 6. "Loved by School Leaders" Testimonials
    await expect(
      page.getByRole("heading", { name: "Loved by School Leaders", level: 2 }),
    ).toBeVisible();
    await expect(page.getByText("Sunrise International School")).toBeVisible();
    await expect(page.getByText("Green Valley Public School")).toBeVisible();
    await expect(page.getByText("Riverside Academy")).toBeVisible();

    // 7. CTA Banner
    await expect(
      page.getByRole("heading", { name: "Ready to Digitize Your School?", level: 2 }),
    ).toBeVisible();
    await expect(page.locator("#book-demo-banner-btn")).toBeVisible();

    // 8. Footer
    const footer = page.locator("footer");
    await expect(footer).toContainText("School Management SaaS");
    await expect(footer).toContainText("Product");
    await expect(footer).toContainText("Resources");
    await expect(footer).toContainText("Company");
    await expect(footer).toContainText("Stay Updated");
    await expect(footer).toContainText("Made for Schools");
  });

  test("clicking Explore Now on feature card navigates to registration with preselected feature", async ({
    page,
  }) => {
    await page.goto("/for-schools");

    const admissionsCard = page.locator('div:has(> div > div > h3:has-text("Admissions"))').first();
    await admissionsCard.scrollIntoViewIfNeeded();

    const admissionsExplore = admissionsCard.getByRole("link", { name: "Explore Now" });
    await expect(admissionsExplore).toHaveAttribute("href", "/register?step=1&feature=admissions");
  });

  test("Book a Demo modal opens, fills, and submits smoothly on for-schools page", async ({
    page,
  }) => {
    await page.goto("/for-schools");

    const bookDemoBtn = page.locator("#book-demo-hero-btn");
    await expect(bookDemoBtn).toBeVisible();
    await bookDemoBtn.click();

    // Modal opens
    await expect(
      page.getByRole("heading", { name: "Book a Personalized Demo", level: 3 }),
    ).toBeVisible();

    // Fill form
    await page.getByPlaceholder("e.g. Dr. Anil Sharma").fill("Dr. Neha Agarwal");
    await page.getByPlaceholder("e.g. Sunrise International School").fill("St. Xavier Global Academy");
    await page.getByPlaceholder("principal@school.edu").fill("principal@stxavier.edu.in");
    await page.getByPlaceholder("+91 98765 43210").fill("+91 98765 99887");

    // Submit
    const submitBtn = page.getByRole("button", { name: "Schedule My School Demo →" });
    await submitBtn.click();

    // Confirmation
    await expect(
      page.getByRole("heading", { name: "Demo Requested!", level: 3 }),
    ).toBeVisible();
    await expect(
      page.getByText("Our school onboarding team will reach out within 24 hours"),
    ).toBeVisible();
  });

  test("for-schools page mobile responsiveness test at 390px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/for-schools");

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

    console.log("FOR SCHOOLS PAGE MOBILE OVERFLOW:", JSON.stringify(overflows, null, 2));
    expect(overflows.scrollWidth <= overflows.docWidth).toBe(true);

    // Test mobile hamburger menu
    const menuBtn = page.getByRole("button", { name: "Toggle navigation menu" });
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // Mobile nav drawer should open
    await expect(page.getByRole("link", { name: "Features" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "For Schools" }).first()).toBeVisible();
  });
});
