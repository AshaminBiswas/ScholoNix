import { chromium } from "@playwright/test";
import path from "path";

const OUTPUT_DIR = "C:/Users/asham/.gemini/antigravity/brain/ca512b70-fdd7-49b4-9f62-1dd753a9f3ed/forgot_password_evidence";

async function run() {
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Screenshots (1280x800)
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  // Step 1: Mobile Tab
  await page.goto("http://localhost:3000/forgot-password?step=1&channel=phone", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "01_desktop_step1_mobile.png") });

  // Step 1: Email Tab
  const emailTab = page.getByRole("button", { name: "Email Address" });
  await emailTab.click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "02_desktop_step1_email.png") });

  // Step 2: Verify OTP
  await page.goto("http://localhost:3000/forgot-password?step=2", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "03_desktop_step2_verify_otp.png") });

  // Step 3: Create New Password
  await page.goto("http://localhost:3000/forgot-password?step=3", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "04_desktop_step3_create_password.png") });

  // Step 4: Password Changed Successfully
  await page.goto("http://localhost:3000/forgot-password?step=4", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "05_desktop_step4_celebration.png") });

  await context.close();

  // 2. Mobile Screenshots (390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
  });
  const mobilePage = await mobileContext.newPage();

  // Mobile Step 1
  await mobilePage.goto("http://localhost:3000/forgot-password?step=1", { waitUntil: "networkidle" });
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "06_mobile_step1.png") });

  // Mobile Step 2
  await mobilePage.goto("http://localhost:3000/forgot-password?step=2", { waitUntil: "networkidle" });
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "07_mobile_step2.png") });

  // Mobile Step 3
  await mobilePage.goto("http://localhost:3000/forgot-password?step=3", { waitUntil: "networkidle" });
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "08_mobile_step3.png") });

  // Mobile Step 4
  await mobilePage.goto("http://localhost:3000/forgot-password?step=4", { waitUntil: "networkidle" });
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "09_mobile_step4.png") });

  await mobileContext.close();
  await browser.close();

  console.log("All screenshots captured successfully in:", OUTPUT_DIR);
}

run().catch((err) => {
  console.error("Visual capture failed:", err);
  process.exit(1);
});
