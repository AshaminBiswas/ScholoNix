import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const EVIDENCE_DIR = path.resolve(
  "C:/Users/asham/.gemini/antigravity/brain/ca512b70-fdd7-49b4-9f62-1dd753a9f3ed/faqs_evidence"
);

test.beforeAll(() => {
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }
});

test.describe("Frequently Asked Questions (FAQs) Page", () => {
  test("1. Renders desktop hero, active resources pill, categories, and default expanded question", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/faqs", { waitUntil: "networkidle" });

    // Check title and hero
    await expect(page).toHaveTitle(/Frequently Asked Questions \(FAQs\)/i);
    await expect(page.locator("h1")).toContainText("Frequently Asked Questions");
    await expect(
      page.getByText(
        "Find quick answers to common questions about School Management SaaS, features, pricing and more."
      )
    ).toBeVisible();

    // Verify Resources dropdown in header is highlighted as active purple pill
    const resourcesDropdownTrigger = page.locator("button:has-text('Resources')");
    await expect(resourcesDropdownTrigger).toBeVisible();
    await expect(resourcesDropdownTrigger).toHaveClass(/bg-\[#8B5CF6\]/);

    // Verify badge (?) FAQs in hero section
    await expect(page.locator("section").first().locator("div.inline-flex:has-text('FAQs')")).toBeVisible();

    // Verify 3D Laptop Hero Illustration with "?"
    const svgIllustration = page.locator("svg[viewBox='0 0 520 380']");
    await expect(svgIllustration).toBeVisible();
    await expect(svgIllustration.locator("text")).toHaveText("?");

    // Verify default expanded question in General: "What is School Management SaaS?"
    const firstQuestion = page.getByRole("button", { name: "What is School Management SaaS?" });
    await expect(firstQuestion).toBeVisible();
    await expect(
      page.getByText(
        "School Management SaaS is a cloud-based platform that helps schools manage their entire operations, including admissions, academics, attendance, fees, staff, communication and reports — all in one place."
      )
    ).toBeVisible();

    // Verify left sidebar category count card
    const sidebar = page.locator("aside");
    await expect(sidebar.getByText("FAQ Categories")).toBeVisible();
    await expect(sidebar.getByText("All FAQs")).toBeVisible();
    await expect(sidebar.getByText("32")).toBeVisible();
    await expect(sidebar.getByText("General")).toBeVisible();
    await expect(sidebar.getByText("6")).toBeVisible();
    await expect(sidebar.getByText("Features")).toBeVisible();
    await expect(sidebar.getByText("8")).toBeVisible();

    // Verify "Still Have a Question?" card
    await expect(sidebar.getByText("Still Have a Question?")).toBeVisible();
    await expect(sidebar.getByRole("button", { name: /Contact Support/i })).toBeVisible();

    // Capture desktop initial state screenshot
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "01_desktop_faqs_initial.png"),
      fullPage: true,
    });
  });

  test("2. Accordion toggle micro-interactions work seamlessly", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/faqs", { waitUntil: "networkidle" });

    // "Who can use this platform?" starts collapsed
    const question2 = page.getByRole("button", { name: "Who can use this platform?" });
    await expect(question2).toBeVisible();

    const answer2 = page.getByText(
      "The platform is designed for school administrators, principals, accountants, teachers, parents, and students."
    );
    await expect(answer2).not.toBeVisible();

    // Click to expand
    await question2.click();
    await expect(answer2).toBeVisible();

    // Test helpful feedback micro-interaction
    const yesButton = page.locator("#who-can-use-this-platform").getByRole("button", { name: /Yes/i });
    await yesButton.click();
    await expect(page.getByText("Thanks for your feedback!")).toBeVisible();

    // Test copy link micro-interaction
    const copyLinkButton = page.locator("#who-can-use-this-platform").getByRole("button", { name: /Copy Link/i });
    await copyLinkButton.click();
    await expect(page.getByText("Direct question link copied to clipboard!")).toBeVisible();

    // Capture accordion expanded screenshot
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "02_accordion_expanded.png"),
    });

    // Click again to collapse
    await question2.click();
    await expect(answer2).not.toBeVisible();
  });

  test("3. Category filter tabs filter FAQ sections accurately", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/faqs", { waitUntil: "networkidle" });

    // Click "Pricing & Plans" tab in horizontal bar
    const pricingTab = page.locator("section button:has-text('Pricing & Plans')").first();
    await pricingTab.click();

    // Main section should now show Pricing & Plans and not General
    await expect(page.locator("h3:has-text('Pricing & Plans')").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "What pricing plans do you offer?" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "What is School Management SaaS?" })
    ).not.toBeVisible();

    // Capture filtered category screenshot
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "03_pricing_category_filtered.png"),
    });

    // Switch back to "All FAQs"
    const allFaqsTab = page.locator("section button:has-text('All FAQs')").first();
    await allFaqsTab.click();
    await expect(
      page.getByRole("button", { name: "What is School Management SaaS?" })
    ).toBeVisible();
  });

  test("4. Real-time search filters questions across categories with instant count", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/faqs", { waitUntil: "networkidle" });

    const searchInput = page.getByPlaceholder("Search FAQs...");
    await searchInput.fill("attendance");

    // Should show results containing attendance
    await expect(page.getByText(/Found \d+ matching question/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Can I manage admissions, attendance and fees in one system?" })
    ).toBeVisible();

    // Capture search results screenshot
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "04_search_results.png"),
    });

    // Clear search with clear button
    const clearButton = page.locator("button[title='Clear search']");
    await clearButton.click();
    await expect(searchInput).toHaveValue("");
    await expect(
      page.getByRole("button", { name: "What is School Management SaaS?" })
    ).toBeVisible();
  });

  test("5. Contact Support modal opens, accepts inquiry submission and displays toast", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/faqs", { waitUntil: "networkidle" });

    // Click "Contact Support →" in sidebar
    const contactBtn = page.locator("aside").getByRole("button", { name: /Contact Support/i });
    await contactBtn.click();

    // Verify modal elements
    await expect(page.getByText("Contact Support Team")).toBeVisible();
    await expect(page.getByText("We typically respond within 15 minutes during school hours.")).toBeVisible();

    // Fill contact form
    await page.getByPlaceholder("e.g. Principal Anita Sharma").fill("Vice Principal Rajesh Verma");
    await page.getByPlaceholder("e.g. principal@greenvalley.edu").fill("rajesh@delhipublicschool.org");
    await page.getByPlaceholder("Please describe what you need assistance with...").fill(
      "We need clarification on CBSE 9-point grading scale setup in the examination module."
    );

    // Capture modal screenshot
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "05_contact_modal.png"),
    });

    // Submit ticket
    await page.getByRole("button", { name: /Send Ticket/i }).click();

    // Verify toast confirmation
    await expect(page.getByText("Support ticket created! We'll reply via email shortly.")).toBeVisible();
  });

  test("6. Book a Demo modal opens from bottom banner and allows demo booking", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/faqs", { waitUntil: "networkidle" });

    // Scroll to bottom banner
    const banner = page.locator("section:has-text('Ready to Get Started?')");
    await banner.scrollIntoViewIfNeeded();

    const bookDemoBtn = banner.getByRole("button", { name: /Book a Demo/i });
    await bookDemoBtn.click();

    // Verify modal
    await expect(page.getByText("Schedule a Live Demo")).toBeVisible();
    await page.getByPlaceholder("e.g. Principal Rajesh Mehta").fill("Principal Sunita Rao");
    await page.getByPlaceholder("e.g. Sunrise Public School").fill("St. Xavier's International School");
    await page.getByPlaceholder("e.g. principal@sunriseschool.org").fill("principal@stxaviers.edu");

    // Capture demo modal screenshot
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "06_demo_modal.png"),
    });

    // Confirm slot
    await page.getByRole("button", { name: /Confirm Demo Slot/i }).click();
    await expect(page.getByText("Demo booked! Our education consultant will reach out shortly.")).toBeVisible();
  });

  test("7. Mobile layout renders responsive navigation, category scrolling, and drawer", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/faqs", { waitUntil: "networkidle" });

    // Check header and mobile hamburger
    const hamburger = page.locator("header button[aria-label='Toggle navigation menu']");
    await expect(hamburger).toBeVisible();

    // Category tabs should be scrollable
    const horizontalTabs = page.locator("section button:has-text('All FAQs')").first();
    await expect(horizontalTabs).toBeVisible();

    // Accordion should work cleanly on mobile
    const firstQuestion = page.getByRole("button", { name: "What is School Management SaaS?" });
    await expect(firstQuestion).toBeVisible();

    // Open hamburger drawer
    await hamburger.click();
    const mobileResourcesBtn = page.locator("header div.md\\:hidden").getByRole("button", { name: "Resources" });
    await expect(mobileResourcesBtn).toBeVisible();
    await mobileResourcesBtn.click();
    await expect(page.locator("header div.md\\:hidden").getByText("Quick answers about our platform")).toBeVisible();

    // Capture mobile screenshot
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "07_mobile_faqs.png"),
      fullPage: true,
    });
  });

  test("8. Navigation redirect: /faq smoothly redirects to /faqs", async ({ page }) => {
    await page.goto("/faq", { waitUntil: "networkidle" });
    expect(page.url()).toContain("/faqs");
  });
});
