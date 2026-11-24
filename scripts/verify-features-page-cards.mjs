import { chromium } from "@playwright/test";
import path from "path";

const OUTPUT_DIR = "C:/Users/asham/.gemini/antigravity/brain/5027b5c1-11f9-4b7f-a70b-a558d7c45785/evidence";

async function verifyFeatures() {
  console.log("Launching browser to verify /features...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 850 },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
  });

  const page = await context.newPage();
  await page.goto("http://localhost:3000/features", { waitUntil: "networkidle" });

  // 1. Capture Hero Section with animations
  console.log("Capturing animated Hero Section...");
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "07_hero_animated_section.png") });

  // 2. Scroll to All Features Section
  console.log("Scrolling down to #features section...");
  await page.evaluate(() => {
    const el = document.querySelector("#features");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  await page.waitForTimeout(1000);

  // Capture All Features with fixed tight padding above Explore Module
  console.log("Capturing All Features cards with fixed compact padding...");
  await page.screenshot({ path: path.join(OUTPUT_DIR, "08_all_features_fixed_padding.png") });

  // 3. Scroll to More Powerful Capabilities Section
  console.log("Scrolling to More Powerful Capabilities section...");
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll("h2"));
    const capHeading = headings.find(h => h.innerText.includes("More Powerful Capabilities"));
    if (capHeading) {
      capHeading.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  await page.waitForTimeout(800);

  console.log("Capturing More Powerful Capabilities 4 cards...");
  await page.screenshot({ path: path.join(OUTPUT_DIR, "09_capabilities_4_cards.png") });

  // Hover over Role-based Access capability card
  console.log("Hovering over Role-based Access capability card...");
  const capCard0 = page.locator("h3:has-text('Role-based Access')").locator("xpath=ancestor::div[contains(@class, 'group')][1]");
  await capCard0.hover();
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "10_hover_capability_card.png") });

  await browser.close();
  console.log("All screenshots captured successfully!");
}

verifyFeatures().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
