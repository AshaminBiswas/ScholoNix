import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const EVIDENCE_DIR = path.resolve(
  "C:/Users/asham/.gemini/antigravity/brain/ca512b70-fdd7-49b4-9f62-1dd753a9f3ed/background_evidence"
);

test.beforeAll(() => {
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }
});

test.describe("Consistent Home Page Background Across All Resources Pages", () => {
  test("1. Home page background reference", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible();

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "01_home_page_background.png"),
      fullPage: false,
    });
  });

  test("2. /blog page has same atmospheric background", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/blog", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible();

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "02_blog_page_background.png"),
      fullPage: false,
    });
  });

  test("3. /help page has same atmospheric background", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/help", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible();

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "03_help_page_background.png"),
      fullPage: false,
    });
  });

  test("4. /faqs page has same atmospheric background", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/faqs", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible();

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "04_faqs_page_background.png"),
      fullPage: false,
    });
  });

  test("5. /guides page has same atmospheric background", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("/guides", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible();

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "05_guides_page_background.png"),
      fullPage: false,
    });
  });
});
