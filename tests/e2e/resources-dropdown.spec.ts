import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const evidenceDir = path.resolve(
  "C:/Users/asham/.gemini/antigravity/brain/ca512b70-fdd7-49b4-9f62-1dd753a9f3ed/dropdown_evidence"
);
fs.mkdirSync(evidenceDir, { recursive: true });

test.describe("Navigation Resources Dropdown", () => {
  test("desktop: hover and click opens dropdown with all 4 items and correct content", async ({
    page,
    isMobile,
  }) => {
    test.skip(Boolean(isMobile), "Desktop navigation test");

    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

    // Locate desktop navbar
    const desktopNav = page.locator("header nav.md\\:flex");
    const resourcesBtn = desktopNav.getByRole("button", { name: /Resources/i });
    await expect(resourcesBtn).toBeVisible();

    // Hover over Resources button to trigger dropdown
    await resourcesBtn.hover();
    await page.waitForTimeout(300);

    // Verify dropdown menu is visible
    const dropdownMenu = desktopNav.getByRole("menu");
    await expect(dropdownMenu).toBeVisible();

    // Verify all 4 resource items are present and have correct title & description
    const blogItem = dropdownMenu.getByRole("menuitem", { name: /Blog/i });
    await expect(blogItem).toBeVisible();
    await expect(blogItem).toContainText("Blog");
    await expect(blogItem).toContainText("Insights, tips and best practices");
    await expect(blogItem).toHaveAttribute("href", "/#blog");

    const helpItem = dropdownMenu.getByRole("menuitem", { name: /Help Center/i });
    await expect(helpItem).toBeVisible();
    await expect(helpItem).toContainText("Help Center");
    await expect(helpItem).toContainText("Get answers to common questions");
    await expect(helpItem).toHaveAttribute("href", "/#help");

    const faqsItem = dropdownMenu.getByRole("menuitem", { name: /FAQs/i });
    await expect(faqsItem).toBeVisible();
    await expect(faqsItem).toContainText("FAQs");
    await expect(faqsItem).toContainText("Quick answers about our platform");
    await expect(faqsItem).toHaveAttribute("href", "/#faqs");

    const guidesItem = dropdownMenu.getByRole("menuitem", { name: /Guides/i });
    await expect(guidesItem).toBeVisible();
    await expect(guidesItem).toContainText("Guides");
    await expect(guidesItem).toContainText("Step-by-step guides and resources");
    await expect(guidesItem).toHaveAttribute("href", "/#guides");

    // Capture screenshot of the open dropdown
    await page.screenshot({
      path: path.join(evidenceDir, "01_desktop_dropdown_open.png"),
      fullPage: false,
    });

    // Hover over Blog item to test hover styling
    await blogItem.hover();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(evidenceDir, "02_desktop_dropdown_item_hover.png"),
      fullPage: false,
    });

    // Test ESC key closes dropdown
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await expect(dropdownMenu).not.toBeVisible();

    // Move mouse away to reset hover state
    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);

    // Test Click opens dropdown
    await resourcesBtn.click();
    await page.waitForTimeout(300);
    await expect(dropdownMenu).toBeVisible();

    // Clicking outside closes it
    await page.mouse.click(10, 10);
    await page.waitForTimeout(300);
    await expect(dropdownMenu).not.toBeVisible();
  });

  test("mobile: drawer contains expandable Resources accordion", async ({
    page,
  }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

    // Open mobile hamburger menu
    const menuBtn = page.getByRole("button", { name: "Toggle Navigation Menu" });
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // Target the mobile drawer specifically
    const mobileDrawer = page.locator("header div.md\\:hidden");
    await expect(mobileDrawer).toBeVisible();

    // Click Resources accordion button inside drawer
    const mobileResourcesBtn = mobileDrawer.getByRole("button", { name: /Resources/i });
    await expect(mobileResourcesBtn).toBeVisible();
    await mobileResourcesBtn.click();

    // Verify all 4 items are in the mobile drawer
    await expect(mobileDrawer.getByRole("link", { name: /Blog/i })).toBeVisible();
    await expect(mobileDrawer.getByRole("link", { name: /Help Center/i })).toBeVisible();
    await expect(mobileDrawer.getByRole("link", { name: /FAQs/i })).toBeVisible();
    await expect(mobileDrawer.getByRole("link", { name: /Guides/i })).toBeVisible();

    await page.screenshot({
      path: path.join(evidenceDir, "03_mobile_drawer_dropdown_open.png"),
      fullPage: false,
    });
  });

  test("features page & pricing page have functioning Resources dropdown", async ({
    page,
    isMobile,
  }) => {
    test.skip(Boolean(isMobile), "Desktop navigation test");

    // Test on /features
    await page.goto("http://localhost:3000/features", { waitUntil: "networkidle" });
    const featuresNav = page.locator("header nav.md\\:flex");
    const featuresResourcesBtn = featuresNav.getByRole("button", { name: /Resources/i });
    await expect(featuresResourcesBtn).toBeVisible();
    await featuresResourcesBtn.hover();
    await expect(featuresNav.getByRole("menu")).toBeVisible();
    await expect(featuresNav.getByRole("menuitem", { name: /Blog/i })).toBeVisible();

    // Test on /pricing
    await page.goto("http://localhost:3000/pricing", { waitUntil: "networkidle" });
    const pricingNav = page.locator("header nav.md\\:flex");
    const pricingResourcesBtn = pricingNav.getByRole("button", { name: /Resources/i });
    await expect(pricingResourcesBtn).toBeVisible();
    await pricingResourcesBtn.hover();
    await expect(pricingNav.getByRole("menu")).toBeVisible();
    await expect(pricingNav.getByRole("menuitem", { name: /Guides/i })).toBeVisible();
  });
});
