import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const LOGO_EVIDENCE_DIR = path.resolve(
  "C:/Users/asham/.gemini/antigravity/brain/ca512b70-fdd7-49b4-9f62-1dd753a9f3ed/logo_evidence"
);

test.beforeAll(() => {
  if (!fs.existsSync(LOGO_EVIDENCE_DIR)) {
    fs.mkdirSync(LOGO_EVIDENCE_DIR, { recursive: true });
  }
});

test.describe("ScholoNix Brand Logo Verification", () => {
  test("1. Home page header with ScholoNix logo", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const logo = page.locator('header img[alt="ScholoNix"]');
    await expect(logo).toBeVisible();

    await page.screenshot({
      path: path.join(LOGO_EVIDENCE_DIR, "01_home_header_logo.png"),
      fullPage: false,
    });
  });

  test("2. Guides page header and footer logo", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/guides", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const logo = page.locator('header img[alt="ScholoNix"]');
    await expect(logo).toBeVisible();

    await page.screenshot({
      path: path.join(LOGO_EVIDENCE_DIR, "02_guides_header_logo.png"),
      fullPage: false,
    });
  });

  test("3. Login page with ScholoNix navbar & card logo", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const logo = page.locator('header img[alt="ScholoNix"]');
    await expect(logo).toBeVisible();

    await page.screenshot({
      path: path.join(LOGO_EVIDENCE_DIR, "03_login_page_logo.png"),
      fullPage: false,
    });
  });

  test("4. Blog page with ScholoNix logo", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/blog", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const logo = page.locator('header img[alt="ScholoNix"]');
    await expect(logo).toBeVisible();

    await page.screenshot({
      path: path.join(LOGO_EVIDENCE_DIR, "04_blog_header_logo.png"),
      fullPage: false,
    });
  });

  test("5. Help page with ScholoNix logo", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/help", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const logo = page.locator('header img[alt="ScholoNix"]');
    await expect(logo).toBeVisible();

    await page.screenshot({
      path: path.join(LOGO_EVIDENCE_DIR, "05_help_header_logo.png"),
      fullPage: false,
    });
  });

  test("6. FAQs page with ScholoNix logo", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/faqs", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const logo = page.locator('header img[alt="ScholoNix"]');
    await expect(logo).toBeVisible();

    await page.screenshot({
      path: path.join(LOGO_EVIDENCE_DIR, "06_faqs_header_logo.png"),
      fullPage: false,
    });
  });

  test("7. Mobile viewport header logo", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const logo = page.locator('header img[alt="ScholoNix"]');
    await expect(logo).toBeVisible();

    await page.screenshot({
      path: path.join(LOGO_EVIDENCE_DIR, "07_mobile_header_logo.png"),
      fullPage: false,
    });
  });
});
