import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const DETAIL_EVIDENCE_DIR = path.resolve(
  "C:/Users/asham/.gemini/antigravity/brain/ca512b70-fdd7-49b4-9f62-1dd753a9f3ed/faq_detail_evidence"
);

test.beforeAll(() => {
  if (!fs.existsSync(DETAIL_EVIDENCE_DIR)) {
    fs.mkdirSync(DETAIL_EVIDENCE_DIR, { recursive: true });
  }
});

test.describe("Dynamic FAQ Detail Page (/faqs/[slug])", () => {
  test("1. Renders desktop FAQ detail page with breadcrumbs, dashboard illustration, benefits & steps", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/faqs/what-is-school-management-saas", { waitUntil: "networkidle" });

    // Verify Title & SEO
    await expect(page).toHaveTitle(/What is School Management SaaS\? \| School Management SaaS FAQs/i);

    // Verify Breadcrumbs
    const breadcrumbNav = page.locator("nav.flex.items-center");
    await expect(breadcrumbNav.getByText("FAQs")).toBeVisible();
    await expect(breadcrumbNav.getByText("General")).toBeVisible();
    await expect(breadcrumbNav.getByText("What is School Management SaaS?")).toBeVisible();

    // Verify Heading & Badge
    await expect(page.locator("h1")).toHaveText("What is School Management SaaS?");
    await expect(page.locator("header").getByText("General").first()).toBeVisible();

    // Verify Metadata
    await expect(page.getByText("Last updated: Aug 28, 2025")).toBeVisible();
    await expect(page.getByText("Reading time: 4 min")).toBeVisible();

    // Verify Overview and 3D Dashboard artwork
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
    await expect(
      page.getByText(
        "School Management SaaS (Software as a Service) is a cloud-based platform that helps schools manage their entire operations in one place."
      )
    ).toBeVisible();

    // Verify Laptop Dashboard Elements inside SVG
    const svgDashboard = page.locator("svg[viewBox='0 0 620 340']");
    await expect(svgDashboard).toBeVisible();
    await expect(svgDashboard.locator("text:has-text('1,248')")).toBeVisible();
    await expect(svgDashboard.locator("text:has-text('82')")).toBeVisible();
    await expect(svgDashboard.locator("text:has-text('36')")).toBeVisible();
    await expect(svgDashboard.locator("text:has-text('₹24,56,000')")).toBeVisible();

    // Verify Key Benefits (4 Cards)
    await expect(page.getByRole("heading", { name: "Key Benefits" })).toBeVisible();
    await expect(page.getByText("All-in-One Platform")).toBeVisible();
    await expect(page.getByText("Cloud-Based & Secure")).toBeVisible();
    await expect(page.getByText("Better Collaboration")).toBeVisible();
    await expect(page.getByText("Data-Driven Decisions")).toBeVisible();

    // Verify Getting Started in 3 Steps
    await expect(page.getByRole("heading", { name: "Getting Started in 3 Steps" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create Your School" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Add Your Data" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Start Managing" })).toBeVisible();

    // Verify Info Callout Box
    await expect(
      page.getByText("In short, School Management SaaS simplifies school operations")
    ).toBeVisible();

    // Verify Sidebar elements
    const sidebar = page.locator("aside");
    await expect(sidebar.getByText("Search FAQs")).toBeVisible();
    await expect(sidebar.getByText("FAQ Categories")).toBeVisible();
    await expect(sidebar.getByText("Still Need Help?")).toBeVisible();
    await expect(sidebar.getByText("Book a Demo").first()).toBeVisible();

    // Capture desktop full page screenshot
    await page.screenshot({
      path: path.join(DETAIL_EVIDENCE_DIR, "01_desktop_faq_detail.png"),
      fullPage: true,
    });
  });

  test("2. Micro-interactions: Share button, Helpful feedback & Related FAQ accordions", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/faqs/what-is-school-management-saas", { waitUntil: "networkidle" });

    // Test Share button
    const shareBtn = page.getByRole("button", { name: "Share" });
    await shareBtn.click();
    await expect(page.getByText("Article link copied to clipboard!")).toBeVisible();

    // Test Helpful feedback (Yes)
    const yesBtn = page.getByRole("button", { name: "Yes" });
    await yesBtn.click();
    await expect(page.getByText("Thanks for your feedback!")).toBeVisible();

    // Test Related FAQs accordion expand/collapse
    const relatedSection = page.locator("section:has-text('Related FAQs')");
    await expect(relatedSection).toBeVisible();

    const relatedQ1 = relatedSection.getByRole("button", { name: "Who can use this platform?" });
    await expect(relatedQ1).toBeVisible();
    await relatedQ1.click();

    // Answer should become visible
    await expect(
      relatedSection.getByText(
        "The platform is designed for school administrators, principals, accountants, teachers, parents, and students."
      )
    ).toBeVisible();

    // Capture screenshot of expanded related FAQ
    await page.screenshot({
      path: path.join(DETAIL_EVIDENCE_DIR, "02_related_faq_expanded.png"),
    });

    // Collapse
    await relatedQ1.click();
  });

  test("3. Sidebar Contact Support & Book a Demo modals operate smoothly", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/faqs/what-is-school-management-saas", { waitUntil: "networkidle" });

    const sidebar = page.locator("aside");

    // Open Contact Support modal
    await sidebar.getByRole("button", { name: /Contact Support/i }).click();
    await expect(page.getByText("Contact Support").first()).toBeVisible();

    await page.getByPlaceholder("e.g. Principal Anita Sharma").fill("Dean Ramesh Rao");
    await page.getByPlaceholder("e.g. principal@greenvalley.edu").fill("dean@greenvalley.edu");
    await page.getByPlaceholder("Tell us what you'd like more clarification on...").fill(
      "Can we schedule a 1-on-1 walkthrough for our administrative trust members?"
    );

    // Capture modal screenshot
    await page.screenshot({
      path: path.join(DETAIL_EVIDENCE_DIR, "03_contact_modal.png"),
    });

    await page.getByRole("button", { name: /Send Inquiry/i }).click();
    await expect(page.getByText("Ticket submitted! Our support team will reply within 15 minutes.")).toBeVisible();

    // Open Book a Demo modal from sidebar
    await sidebar.getByRole("button", { name: /Book a Demo/i }).click();
    await expect(page.getByText("Schedule a Live Demo")).toBeVisible();
    await page.getByPlaceholder("e.g. Principal Rajesh Mehta").fill("Dr. Alok Nath");
    await page.getByPlaceholder("e.g. Greenfield Academy").fill("Cambridge International School");
    await page.getByPlaceholder("e.g. admin@greenfield.edu").fill("admin@cambridge.edu");

    // Capture demo modal screenshot
    await page.screenshot({
      path: path.join(DETAIL_EVIDENCE_DIR, "04_demo_modal.png"),
    });

    await page.getByRole("button", { name: /Confirm Demo/i }).click();
    await expect(page.getByText("Demo scheduled! Our education consultant will contact you shortly.")).toBeVisible();
  });

  test("4. Responsive mobile layout renders seamlessly", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/faqs/what-is-school-management-saas", { waitUntil: "networkidle" });

    // Heading should be visible
    await expect(page.locator("h1")).toHaveText("What is School Management SaaS?");

    // 3D Dashboard artwork renders responsively
    await expect(page.locator("svg[viewBox='0 0 620 340']")).toBeVisible();

    // 4 Key Benefits stack cleanly
    await expect(page.getByText("All-in-One Platform")).toBeVisible();

    // Bottom banner "Have More Questions?" with "View All FAQs"
    const bottomBanner = page.locator("section:has-text('Have More Questions?')");
    await expect(bottomBanner).toBeVisible();
    await expect(bottomBanner.getByRole("link", { name: "View All FAQs" })).toBeVisible();

    // Capture mobile full page screenshot
    await page.screenshot({
      path: path.join(DETAIL_EVIDENCE_DIR, "05_mobile_faq_detail.png"),
      fullPage: true,
    });
  });
});
