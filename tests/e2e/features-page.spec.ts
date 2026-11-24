import { test, expect } from "@playwright/test";

test.describe("Features Page Visual & Interactive Workflows", () => {
  test("renders all key sections, hero preview, and 12 feature modules matching mockup", async ({
    page,
  }) => {
    await page.goto("/features");

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
    await expect(page.getByText("Platform Features")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Powerful Features for Complete School Management",
        level: 1,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Everything you need to manage your school's admissions"),
    ).toBeVisible();

    // 3 Value Checkmarks
    await expect(page.getByText("All-in-One Platform")).toBeVisible();
    await expect(page.getByText("Easy to Use")).toBeVisible();
    await expect(page.getByText("Secure & Reliable")).toBeVisible();

    // Hero Action Buttons
    await expect(page.locator("#book-demo-hero-btn")).toBeVisible();

    // Hero Dashboard UI Simulation
    await expect(page.getByText("Students").first()).toBeVisible();
    await expect(page.getByText("1,248")).toBeVisible();
    await expect(page.getByText("Staff", { exact: true })).toBeVisible();
    await expect(page.getByText("86")).toBeVisible();
    await expect(page.getByText("Pending", { exact: true })).toBeVisible();
    await expect(page.getByText("37")).toBeVisible();
    await expect(page.getByText("Fee Dues", { exact: true })).toBeVisible();
    await expect(page.getByText("₹5.48L")).toBeVisible();
    await expect(page.getByText("96.4%")).toBeVisible();
    await expect(page.getByText("Present")).toBeVisible();

    // 3. "Everything Your School Needs" Section Header
    await expect(page.getByText("All Features", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Everything Your School Needs", level: 2 }),
    ).toBeVisible();
    await expect(
      page.getByText("A comprehensive set of modules to run your school efficiently"),
    ).toBeVisible();

    // All 12 Feature Module Cards
    await expect(page.getByRole("heading", { name: "Admissions", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Academics", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Attendance", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Fees & Payments", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Staff Management", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Students", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Parents & Communication", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Timetable", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Examinations", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Reports & Analytics", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Library Management", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Transport (Optional)", level: 3 })).toBeVisible();

    // 4. "More Powerful Capabilities"
    await expect(
      page.getByRole("heading", { name: "More Powerful Capabilities", level: 2 }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Role-based Access" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cloud & Secure" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Multi-Device Access" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Scalable for Growth" })).toBeVisible();

    // 5. "Ready to Explore All Features?" CTA Banner
    await expect(
      page.getByRole("heading", { name: "Ready to Explore All Features?", level: 2 }),
    ).toBeVisible();
    await expect(page.locator("#book-demo-banner-btn")).toBeVisible();

    // 6. Footer
    const footer = page.locator("footer");
    await expect(footer).toContainText("School Management SaaS");
    await expect(footer).toContainText("Product");
    await expect(footer).toContainText("Resources");
    await expect(footer).toContainText("Company");
    await expect(footer).toContainText("Stay Updated");
    await expect(footer).toContainText("Made for Schools");
  });

  test("Book a Demo modal opens, submits, and shows success confirmation", async ({
    page,
  }) => {
    await page.goto("/features");

    const bookDemoBtn = page.locator("#book-demo-hero-btn");
    await expect(bookDemoBtn).toBeVisible();
    await bookDemoBtn.click();

    // Modal should be visible
    await expect(
      page.getByRole("heading", { name: "Book a Free Demo", level: 3 }),
    ).toBeVisible();

    // Fill form
    await page.getByPlaceholder("e.g. Principal Sharma").fill("Principal Ananya Roy");
    await page.getByPlaceholder("e.g. Delhi Public Academy").fill("Greenwood World Academy");
    await page.getByPlaceholder("principal@school.edu.in").fill("principal@greenwood.edu.in");
    await page.getByPlaceholder("+91 98765 43210").fill("+91 98765 11223");

    // Submit
    const submitBtn = page.getByRole("button", { name: "Schedule My Demo →" });
    await submitBtn.click();

    // Confirmation message
    await expect(
      page.getByRole("heading", { name: "Demo Requested!", level: 3 }),
    ).toBeVisible();
    await expect(
      page.getByText("Our school operations specialist will contact you"),
    ).toBeVisible();
  });

  test("features page mobile responsiveness test at 390px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/features");

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

    console.log("FEATURES PAGE MOBILE OVERFLOW:", JSON.stringify(overflows, null, 2));
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
