import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const CARDS_EVIDENCE_DIR = path.resolve(
  "C:/Users/asham/.gemini/antigravity/brain/ca512b70-fdd7-49b4-9f62-1dd753a9f3ed/cards_evidence"
);

test.beforeAll(() => {
  if (!fs.existsSync(CARDS_EVIDENCE_DIR)) {
    fs.mkdirSync(CARDS_EVIDENCE_DIR, { recursive: true });
  }
});

test.describe("Contrasty Gradient Cards Across Resources Pages", () => {
  test("1. /blog cards contrast and gradients", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.goto("/blog", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(CARDS_EVIDENCE_DIR, "01_blog_cards.png"),
      fullPage: false,
    });
  });

  test("2. /help cards contrast and gradients", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.goto("/help", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(CARDS_EVIDENCE_DIR, "02_help_cards.png"),
      fullPage: false,
    });
  });

  test("3. /faqs cards contrast and gradients", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.goto("/faqs", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(CARDS_EVIDENCE_DIR, "03_faqs_cards.png"),
      fullPage: false,
    });
  });

  test("4. /guides cards contrast and gradients", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.goto("/guides", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(CARDS_EVIDENCE_DIR, "04_guides_cards.png"),
      fullPage: false,
    });
  });

  test("5. /guides detail cards contrast and gradients", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.goto("/guides/complete-school-setup-guide", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(CARDS_EVIDENCE_DIR, "05_guide_detail_cards.png"),
      fullPage: false,
    });
  });
});
