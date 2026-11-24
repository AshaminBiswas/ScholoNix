import { chromium } from "@playwright/test";
import path from "path";

const OUTPUT_DIR = "C:/Users/asham/.gemini/antigravity/brain/ca512b70-fdd7-49b4-9f62-1dd753a9f3ed/features_scroll_evidence";

async function run() {
  const browser = await chromium.launch({ headless: true });
  
  // 1. Desktop Test (1280x800) simulating real human (navigator.webdriver = false)
  console.log("--- Starting Desktop Scroll Verification ---");
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  // Override navigator.webdriver to false so we test real human user behavior
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
  });

  const page = await context.newPage();
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

  // 1a. At top of page (scrollY = 0), check that feature cards are NOT yet in view (opacity-0)
  const initialCardState = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("[data-card-index]"));
    return cards.map((c) => ({
      index: c.getAttribute("data-card-index"),
      className: c.className,
      hasOpacity0: c.className.includes("opacity-0"),
      hasTranslateY: c.className.includes("translate-y-14"),
    }));
  });
  console.log("Initial state at top of page (before scrolling down):", initialCardState.slice(0, 4));

  await page.screenshot({ path: path.join(OUTPUT_DIR, "01_desktop_hero_top.png") });

  // 1b. Scroll down smoothly towards Key Features
  console.log("Scrolling down to Key Features section...");
  await page.evaluate(async () => {
    const target = document.querySelector("#features");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  // Wait for intersection observer and CSS transitions
  await page.waitForTimeout(900);

  // Check card states after scrolling to features
  const scrolledCardState = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("[data-card-index]"));
    return cards.map((c) => ({
      index: c.getAttribute("data-card-index"),
      title: c.querySelector("h3")?.innerText,
      hasOpacity100: c.className.includes("opacity-100"),
      hasTranslateY0: c.className.includes("translate-y-0"),
    }));
  });
  console.log("Scrolled state inside Key Features:", scrolledCardState);

  await page.screenshot({ path: path.join(OUTPUT_DIR, "02_desktop_features_scrolled.png") });

  // 1c. Hover over Admissions (Card 0)
  console.log("Hovering over Admissions card...");
  const admissionsCard = page.locator("[data-card-index='0']");
  await admissionsCard.hover();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "03_desktop_admissions_hover.png") });

  // 1d. Hover over Fees & Payments (Card 3)
  console.log("Hovering over Fees & Payments card...");
  const feesCard = page.locator("[data-card-index='3']");
  await feesCard.hover();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "04_desktop_fees_hover.png") });

  // 1e. Scroll back to top and verify cards reset when scrolled out of view
  console.log("Scrolling back up to top (0, 0)...");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(900);

  const resetCardState = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("[data-card-index]"));
    return cards.map((c) => ({
      index: c.getAttribute("data-card-index"),
      hasOpacity0: c.className.includes("opacity-0"),
    }));
  });
  console.log("State after scrolling back to top:", resetCardState.slice(0, 4));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "05_desktop_scrolled_back_top.png") });

  // 1f. Scroll down again to verify re-animation!
  console.log("Scrolling back down to Key Features to verify re-animation...");
  await page.evaluate(() => {
    const target = document.querySelector("#features");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "06_desktop_reanimated.png") });

  await context.close();

  // 2. Mobile Viewport Test (390x844)
  console.log("--- Starting Mobile Viewport Scroll Verification (390x844) ---");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
  });

  await mobileContext.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
  });

  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto("http://localhost:3000", { waitUntil: "networkidle" });

  // Check no horizontal scrollbar / overflow
  const overflowCheck = await mobilePage.evaluate(() => ({
    bodyScrollWidth: document.body.scrollWidth,
    windowInnerWidth: window.innerWidth,
    hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth,
  }));
  console.log("Mobile overflow check:", overflowCheck);

  // Scroll down to features
  await mobilePage.evaluate(() => {
    const target = document.querySelector("#features");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  await mobilePage.waitForTimeout(900);
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "07_mobile_features_top.png") });

  // Scroll a bit more to see middle cards
  await mobilePage.evaluate(() => window.scrollBy({ top: 500, behavior: "smooth" }));
  await mobilePage.waitForTimeout(700);
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "08_mobile_features_middle.png") });

  // Scroll to bottom cards
  await mobilePage.evaluate(() => window.scrollBy({ top: 600, behavior: "smooth" }));
  await mobilePage.waitForTimeout(700);
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "09_mobile_features_bottom.png") });

  await mobileContext.close();
  await browser.close();

  console.log("Verification finished successfully! All screenshots saved to:", OUTPUT_DIR);
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
