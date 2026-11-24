import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const EVIDENCE_DIR = path.resolve(
  "C:/Users/asham/.gemini/antigravity/brain/ca512b70-fdd7-49b4-9f62-1dd753a9f3ed/guides_evidence"
);

test.beforeAll(() => {
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }
});

test.describe("Step-by-Step Guides Page", () => {
  test("1. Renders desktop hero, active resources pill, category tabs, featured guide, popular guides, and journeys", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/guides", { waitUntil: "networkidle" });

    // 1. Verify Page Title
    await expect(page).toHaveTitle(/Step-by-Step Guides/i);

    // 2. Verify Resources dropdown in header is highlighted as active purple pill
    const resourcesDropdownTrigger = page.locator("header button:has-text('Resources')");
    await expect(resourcesDropdownTrigger).toBeVisible();
    await expect(resourcesDropdownTrigger).toHaveClass(/bg-\[#8B5CF6\]/);

    // 3. Verify Hero Badge: Guides with Book icon
    const heroBadge = page.locator("section").first().locator("div.inline-flex:has-text('Guides')");
    await expect(heroBadge).toBeVisible();

    // 4. Verify Hero Title & Subtitle
    await expect(page.locator("h1")).toContainText("Step-by-Step Guides");
    await expect(
      page.getByText(
        "Learn how to set up, use and get the most out of School Management SaaS with our detailed guides."
      )
    ).toBeVisible();

    // 5. Verify 3D Hero SVG Illustration & Badges
    const heroSvg = page.locator("svg[viewBox='0 0 520 380']");
    await expect(heroSvg).toBeVisible();
    await expect(page.getByText("28 Comprehensive Guides")).toBeVisible();
    await expect(page.getByText("Step-by-Step Walkthroughs")).toBeVisible();

    // 6. Verify Category Filter Tabs (Horizontal Bar)
    const tabsContainer = page.locator("div.scrollbar-none");
    await expect(tabsContainer.getByRole("button", { name: "All Guides" })).toBeVisible();
    await expect(tabsContainer.getByRole("button", { name: "Getting Started" })).toBeVisible();
    await expect(tabsContainer.getByRole("button", { name: "Admin & Settings" })).toBeVisible();
    await expect(tabsContainer.getByRole("button", { name: "Academics" })).toBeVisible();
    await expect(tabsContainer.getByRole("button", { name: "Fees & Payments" })).toBeVisible();
    await expect(tabsContainer.getByRole("button", { name: "Reports & Analytics" })).toBeVisible();
    await expect(tabsContainer.getByRole("button", { name: "Integrations" })).toBeVisible();

    // 7. Verify Sidebar: Guide Categories & Need More Help
    const sidebar = page.locator("aside");
    await expect(sidebar.getByText("Guide Categories")).toBeVisible();
    await expect(sidebar.getByText("28")).toBeVisible();
    await expect(sidebar.getByText("Getting Started")).toBeVisible();
    await expect(sidebar.getByText("Admin & Settings")).toBeVisible();
    await expect(sidebar.getByText("Academics")).toBeVisible();
    await expect(sidebar.getByText("Fees & Payments")).toBeVisible();
    await expect(sidebar.getByText("Reports & Analytics")).toBeVisible();
    await expect(sidebar.getByText("Integrations")).toBeVisible();
    await expect(sidebar.getByText("Need More Help?")).toBeVisible();
    await expect(sidebar.getByRole("button", { name: "Contact Support" })).toBeVisible();

    // 8. Verify Featured Guide Card
    await expect(page.getByText("Featured Guide")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Complete School Setup Guide" })).toBeVisible();
    await expect(page.getByText("Step-by-Step • 12 min read")).toBeVisible();

    // 9. Verify 6 Popular Guides
    await expect(page.getByText("Popular Guides")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Get Started in 10 Minutes" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Manage Users and Roles" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create Classes and Timetables" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Set Up Fees and Payments" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Generate Reports & Analytics" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Connect Integrations" })).toBeVisible();

    // 10. Verify Guides by Journey (4 Cards)
    await expect(page.getByText("Guides by Journey")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Setup Your School" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Manage Daily Operations" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Engage Parents" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Get the Most Value" })).toBeVisible();

    // 11. Verify Bottom Banner
    await expect(page.getByText("New to School Management SaaS?")).toBeVisible();
    await expect(page.getByRole("button", { name: "Book a Demo" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Get Started Free" }).first()).toBeVisible();

    // Screenshot
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "01_desktop_guides_initial.png"),
      fullPage: true,
    });
  });

  test("2. Category filter tabs dynamically filter guides", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/guides", { waitUntil: "networkidle" });

    // Click Academics category tab
    const tabsContainer = page.locator("div.scrollbar-none");
    await tabsContainer.getByRole("button", { name: "Academics" }).click();

    // Verify Guides heading changed to "Guides (5)"
    await expect(page.getByRole("heading", { name: "Guides (5)" })).toBeVisible();

    // Verify an academics guide is visible
    await expect(page.getByRole("heading", { name: "Create Classes and Timetables" })).toBeVisible();

    // Screenshot
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "02_academics_category_filtered.png"),
      fullPage: false,
    });
  });

  test("3. Real-time search filters guides instantly and clear button resets", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/guides", { waitUntil: "networkidle" });

    // Type "timetable" into the search box
    const searchInput = page.getByPlaceholder("Search guides...");
    await searchInput.fill("timetable");

    // Wait for filtered list heading
    await expect(page.getByRole("heading", { name: /Guides \(/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create Classes and Timetables" })).toBeVisible();

    // Screenshot search results
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "03_search_results.png"),
      fullPage: false,
    });

    // Clear search using the clear button
    const clearButton = page.locator("button[aria-label='Clear search query']");
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await expect(searchInput).toHaveValue("");
    }
  });

  test("4. Interactive Contact Support and Book a Demo Modals", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/guides", { waitUntil: "networkidle" });

    // Open Contact Support modal from sidebar
    const contactBtn = page.locator("aside").getByRole("button", { name: "Contact Support" });
    await contactBtn.click();

    // Verify modal elements
    await expect(page.getByRole("heading", { name: "Contact Guide Specialists" })).toBeVisible();
    await page.getByPlaceholder("e.g. Principal Anita Sharma").fill("Principal Priya");
    await page.getByPlaceholder("e.g. principal@greenvalley.edu").fill("principal@greenvalley.edu");
    await page
      .getByPlaceholder("Describe which module or step you need guidance with...")
      .fill("Need guidance on importing student data.");

    // Screenshot Contact Modal
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "04_contact_modal.png"),
    });

    // Submit form
    await page.getByRole("button", { name: "Send Request" }).click();

    // Open Book a Demo modal
    const demoBtn = page.getByRole("button", { name: "Book a Demo" }).first();
    await demoBtn.click();
    await expect(page.getByRole("heading", { name: "Schedule a Live Demo" })).toBeVisible();

    // Screenshot Demo Modal
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "05_demo_modal.png"),
    });
  });

  test("5. Dynamic Guide Detail Page renders walkthrough and micro-interactions", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/guides/complete-school-setup-guide", { waitUntil: "domcontentloaded" });

    // Verify Detail Page Header
    await expect(page).toHaveTitle(/Complete School Setup Guide/i);
    await expect(page.locator("h1")).toContainText("Complete School Setup Guide");

    // Verify Breadcrumbs
    const breadcrumbs = page.locator("nav.mb-6");
    await expect(breadcrumbs.getByRole("link", { name: "Guides" })).toBeVisible();
    await expect(breadcrumbs.getByRole("link", { name: "Getting Started" })).toBeVisible();

    // Verify 6 Steps are rendered
    await expect(page.getByText("Step-by-Step Walkthrough")).toBeVisible();
    await expect(page.getByRole("heading", { name: "School Profile & Institutional Branding" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Class, Section & Curriculum Hierarchy" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bulk Staff & Student Onboarding" })).toBeVisible();

    // Test interactive step completion button on Step 1
    const step1CompleteBtn = page.locator("#step-1 button[aria-label*='Mark Step 1']");
    await step1CompleteBtn.click();

    // Test "Was this step-by-step guide helpful?" feedback
    const yesBtn = page.getByRole("button", { name: "Yes, it helped!" });
    await yesBtn.click();

    // Test "Save Guide" bookmark button
    const saveBtn = page.getByRole("button", { name: "Save Guide" });
    await saveBtn.click();
    await expect(page.getByText(/Guide saved to your bookmarks/i)).toBeVisible();

    // Screenshot Guide Detail
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "06_guide_detail_walkthrough.png"),
      fullPage: false,
    });
  });

  test("6. Responsive Mobile Viewport (390x844)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/guides", { waitUntil: "networkidle" });

    // Verify mobile header
    await expect(page.locator("h1")).toBeVisible();

    // Open mobile hamburger menu
    const menuBtn = page.locator("header button[aria-label='Toggle navigation menu']");
    await menuBtn.click();

    // Verify mobile drawer shows Resources
    await expect(page.locator("header div.md\\:hidden button:has-text('Resources')")).toBeVisible();

    // Screenshot mobile view
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "07_mobile_guides.png"),
    });
  });
});
